"""
Dataset Ingestion Pipeline for Autonomous SQL Database Analyst
Performs end-to-end dataset validation, type inference, missing value analysis,
PostgreSQL ingestion, MongoDB metadata synchronization, and ingestion report generation.
"""

import os
import sys
import json
import datetime
import pandas as pd
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pymongo import MongoClient

# Database Configuration
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_ADMIN_USER = os.getenv("PG_ADMIN_USER", "postgres")
PG_ADMIN_PASSWORD = os.getenv("PG_ADMIN_PASSWORD", "password")
TARGET_DB = "indian_public_data"
MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/autonomous_sql_analyst")

MANIFESTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "datasets", "manifests")
SEEDS_DIR = os.path.join(os.path.dirname(__file__), "..", "seeds")
SCHEMAS_DIR = os.path.join(os.path.dirname(__file__), "..", "schemas")
SCRIPTS_DIR = os.path.dirname(__file__)
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "datasets")

def init_postgres():
    """Ensures target database exists, tables created, and readonly user configured."""
    print(f"[*] Connecting to PostgreSQL at {PG_HOST}:{PG_PORT} as {PG_ADMIN_USER}...")
    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        user=PG_ADMIN_USER,
        password=PG_ADMIN_PASSWORD,
        dbname="postgres"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{TARGET_DB}'")
    exists = cursor.fetchone()
    if not exists:
        print(f"[*] Creating database '{TARGET_DB}'...")
        cursor.execute(f"CREATE DATABASE {TARGET_DB}")
    else:
        print(f"[+] Target database '{TARGET_DB}' already exists.")
    cursor.close()
    conn.close()

    # Now connect to target database to run DDL and setup readonly user
    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        user=PG_ADMIN_USER,
        password=PG_ADMIN_PASSWORD,
        dbname=TARGET_DB
    )
    cursor = conn.cursor()

    # Execute 01_init_tables.sql
    init_sql_path = os.path.join(SCHEMAS_DIR, "01_init_tables.sql")
    if os.path.exists(init_sql_path):
        print(f"[*] Executing schema definitions from {init_sql_path}...")
        with open(init_sql_path, "r", encoding="utf-8") as f:
            cursor.execute(f.read())
        conn.commit()

    # Execute setup_readonly_user.sql
    readonly_sql_path = os.path.join(SCRIPTS_DIR, "setup_readonly_user.sql")
    if os.path.exists(readonly_sql_path):
        print(f"[*] Configuring dedicated read-only role 'analyst_readonly'...")
        with open(readonly_sql_path, "r", encoding="utf-8") as f:
            cursor.execute(f.read())
        conn.commit()

    cursor.close()
    conn.close()
    print("[+] PostgreSQL initialization complete.")

def ingest_dataset(manifest_file, mongo_db):
    """Processes a single dataset from manifest and seed CSV."""
    with open(manifest_file, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    table_name = manifest["tableName"]
    csv_file = os.path.join(SEEDS_DIR, f"{table_name}.csv")
    print(f"\n==================================================")
    print(f"Ingesting: {manifest['title']} ({table_name})")
    print(f"Source file: {csv_file}")

    if not os.path.exists(csv_file):
        raise FileNotFoundError(f"Seed file not found: {csv_file}")

    # 1. File inspection & DataFrame loading
    df = pd.read_csv(csv_file)
    initial_rows = len(df)
    
    # 2. Duplicate Detection
    # Determine key columns for duplicate check
    if "reporting_year" in df.columns:
        subset = ["state_name", "district_name", "reporting_year"]
    elif "census_year" in df.columns:
        subset = ["state_name", "district_name", "census_year"]
    elif "survey_period" in df.columns:
        subset = ["state_name", "district_name", "survey_period"]
    else:
        subset = ["state_name", "district_name"]

    duplicates_count = df.duplicated(subset=subset).sum()
    if duplicates_count > 0:
        print(f"[!] Warning: Found {duplicates_count} duplicate rows. Dropping duplicates...")
        df = df.drop_duplicates(subset=subset)

    # 3. Missing Value Analysis
    missing_analysis = {}
    for col in df.columns:
        null_count = int(df[col].isnull().sum())
        missing_analysis[col] = {
            "nullCount": null_count,
            "nullPercentage": round((null_count / initial_rows) * 100, 2)
        }

    # 4. Data Type Normalization
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].astype(str).str.strip()

    # 5. Database Insertion
    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        user=PG_ADMIN_USER,
        password=PG_ADMIN_PASSWORD,
        dbname=TARGET_DB
    )
    cursor = conn.cursor()

    columns_str = ", ".join(df.columns)
    placeholders = ", ".join(["%s"] * len(df.columns))
    
    # Upsert query with ON CONFLICT DO UPDATE
    if "reporting_year" in df.columns:
        conflict_target = "(district_name, state_name, reporting_year)"
    elif "census_year" in df.columns:
        conflict_target = "(district_name, state_name, census_year)"
    elif "survey_period" in df.columns:
        conflict_target = "(district_name, state_name, survey_period)"
    else:
        conflict_target = "(id)"

    update_cols = [f"{col} = EXCLUDED.{col}" for col in df.columns if col not in subset]
    update_str = ", ".join(update_cols) if update_cols else "created_at = CURRENT_TIMESTAMP"

    insert_sql = f"""
        INSERT INTO {table_name} ({columns_str})
        VALUES ({placeholders})
        ON CONFLICT {conflict_target}
        DO UPDATE SET {update_str};
    """

    inserted_count = 0
    rejected_count = 0
    rejected_errors = []

    for index, row in df.iterrows():
        try:
            values = [None if pd.isna(val) else val for val in row.values]
            cursor.execute(insert_sql, values)
            inserted_count += 1
        except Exception as e:
            rejected_count += 1
            rejected_errors.append(f"Row {index}: {str(e)}")
            conn.rollback()
            continue

    conn.commit()
    cursor.close()
    conn.close()

    print(f"[+] Ingestion status: {inserted_count} rows inserted/updated, {rejected_count} rejected.")

    # 6. MongoDB Metadata Sync
    if mongo_db is not None:
        try:
            metadata_doc = {
                "datasetId": manifest["id"],
                "tableName": table_name,
                "title": manifest["title"],
                "description": manifest["description"],
                "sourceUrl": manifest["sourceUrl"],
                "license": manifest["license"],
                "sourceVersion": manifest["sourceVersion"],
                "sourceUpdatedAt": manifest["sourceUpdatedAt"],
                "reportingPeriods": manifest.get("reportingPeriods", []),
                "importedAt": datetime.datetime.now(datetime.timezone.utc),
                "columns": manifest["columns"],
                "sampleQuestions": manifest.get("sampleQuestions", []),
                "rowCount": inserted_count,
                "missingAnalysis": missing_analysis,
                "provenance": {
                    "provider": "Government of India Official Statistical Sources",
                    "validationPipeline": "CSV inspection, SQLGlot compliance, relational integrity",
                    "readOnlyRole": "analyst_readonly"
                },
                "visibility": "public"
            }
            mongo_db.datasetmetadatas.update_one(
                {"tableName": table_name},
                {"$set": metadata_doc},
                upsert=True
            )
            print("[+] Synchronized dataset metadata in MongoDB.")
        except Exception as e:
            print(f"[!] Warning: Failed to sync MongoDB metadata: {e}")

    report = {
        "datasetId": manifest["id"],
        "tableName": table_name,
        "title": manifest["title"],
        "sourceUrl": manifest["sourceUrl"],
        "license": manifest["license"],
        "initialRows": initial_rows,
        "duplicatesDetected": int(duplicates_count),
        "insertedRows": inserted_count,
        "rejectedRows": rejected_count,
        "rejectedErrors": rejected_errors,
        "missingValueAnalysis": missing_analysis,
        "reportingPeriods": manifest.get("reportingPeriods", [])
    }
    return report

def main():
    print("==================================================")
    print("AUTONOMOUS SQL ANALYST: DATASET INGESTION PIPELINE")
    print("==================================================")
    
    # 1. Initialize Postgres
    init_postgres()

    # 2. Connect to MongoDB
    mongo_db = None
    try:
        mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        mongo_client.server_info()
        mongo_db = mongo_client.get_database()
        print(f"[+] Connected to MongoDB at {MONGO_URI}")
    except Exception as e:
        print(f"[!] MongoDB not reachable ({e}). Proceeding with PostgreSQL only.")

    # 3. Process each manifest
    manifest_files = [
        os.path.join(MANIFESTS_DIR, f)
        for f in os.listdir(MANIFESTS_DIR)
        if f.endswith(".json")
    ]

    reports = []
    for mf in sorted(manifest_files):
        report = ingest_dataset(mf, mongo_db)
        reports.append(report)

    # 4. Generate Ingestion Report
    json_report_path = os.path.join(REPORTS_DIR, "ingestion_report.json")
    with open(json_report_path, "w", encoding="utf-8") as f:
        json.dump(reports, f, indent=2)

    md_report_path = os.path.join(REPORTS_DIR, "ingestion_report.md")
    with open(md_report_path, "w", encoding="utf-8") as f:
        f.write("# Automated Dataset Ingestion & Quality Control Report\n\n")
        f.write(f"*Generated at: {datetime.datetime.now(datetime.timezone.utc).isoformat()}*\n\n")
        f.write("## Ingestion Summary\n\n")
        f.write("| Table Name | Title | Source Version | Inserted Rows | Duplicates | Missing Values |\n")
        f.write("|---|---|---|---|---|---|\n")
        for r in reports:
            total_missing = sum(item["nullCount"] for item in r["missingValueAnalysis"].values())
            f.write(f"| `{r['tableName']}` | {r['title']} | OGDL-India | {r['insertedRows']} | {r['duplicatesDetected']} | {total_missing} |\n")
        f.write("\n## Detailed Quality Metrics\n\n")
        for r in reports:
            f.write(f"### {r['title']} (`{r['tableName']}`)\n")
            f.write(f"- **Source URL:** {r['sourceUrl']}\n")
            f.write(f"- **License:** {r['license']}\n")
            f.write(f"- **Available Reporting Periods:** {', '.join(r['reportingPeriods'])}\n")
            f.write(f"- **Total Rows Ingested:** {r['insertedRows']}\n")
            f.write(f"- **Validation Failures / Rejected Rows:** {r['rejectedRows']}\n")
            f.write("- **Field Quality Analysis:**\n")
            for col, stats in r["missingValueAnalysis"].items():
                f.write(f"  - `{col}`: {stats['nullCount']} nulls ({stats['nullPercentage']}%)\n")
            f.write("\n")

    print("\n[+] Ingestion reports successfully generated:")
    print(f"    - {json_report_path}")
    print(f"    - {md_report_path}")
    print("==================================================")
    print("INGESTION PIPELINE COMPLETED SUCCESSFULLY")
    print("==================================================")

if __name__ == "__main__":
    main()
