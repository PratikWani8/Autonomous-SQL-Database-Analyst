"""
Schema Discovery Service.
Provides controlled, read-only database introspection with in-memory TTL caching.
Exposes only authorized tables and columns to LLM pipelines.
"""

import time
from sqlalchemy import text
from app.core.config import settings
from app.core.database import get_readonly_connection

# In-memory schema cache
_SCHEMA_CACHE = {}
_CACHE_TIMESTAMP = 0
_CACHE_TTL_SECONDS = 3600  # 1 hour TTL

# Enriched column metadata, descriptions and units for Indian Public Datasets
METADATA_REGISTRY = {
    "district_unemployment_stats": {
        "title": "District-wise Labour Force Participation and Unemployment Rates",
        "description": "Annual district-level estimates of rural, urban, and combined unemployment rates along with Labour Force Participation Rate (LFPR) and Worker Population Ratio (WPR) from MoSPI / PLFS.",
        "reportingPeriods": ["2021-22", "2022-23"],
        "columns": {
            "id": {"type": "INTEGER", "description": "Unique identifier", "unit": "ID"},
            "state_name": {"type": "VARCHAR", "description": "Name of the Indian State/UT", "unit": "Text"},
            "district_name": {"type": "VARCHAR", "description": "Name of the administrative district", "unit": "Text"},
            "reporting_year": {"type": "VARCHAR", "description": "Survey period (2021-22, 2022-23)", "unit": "Year"},
            "rural_unemployment_rate": {"type": "NUMERIC", "description": "Unemployment rate in rural areas (%)", "unit": "%"},
            "urban_unemployment_rate": {"type": "NUMERIC", "description": "Unemployment rate in urban areas (%)", "unit": "%"},
            "overall_unemployment_rate": {"type": "NUMERIC", "description": "Combined district unemployment rate (%)", "unit": "%"},
            "labour_force_participation_rate": {"type": "NUMERIC", "description": "Labour Force Participation Rate (LFPR)", "unit": "%"},
            "worker_population_ratio": {"type": "NUMERIC", "description": "Worker Population Ratio (WPR)", "unit": "%"},
            "surveyed_households": {"type": "INTEGER", "description": "Number of sample households surveyed", "unit": "Count"}
        }
    },
    "district_demographics_stats": {
        "title": "District Population, Sex Ratio, and Literacy Statistics",
        "description": "Decennial Census indicators covering total, male, and female population, sex ratio, and literacy metrics across Indian districts for Census 2001 and 2011.",
        "reportingPeriods": ["2001", "2011"],
        "columns": {
            "id": {"type": "INTEGER", "description": "Unique identifier", "unit": "ID"},
            "state_name": {"type": "VARCHAR", "description": "Name of the Indian State/UT", "unit": "Text"},
            "district_name": {"type": "VARCHAR", "description": "Administrative district name", "unit": "Text"},
            "census_year": {"type": "INTEGER", "description": "Census enumeration year (2001 or 2011)", "unit": "Year"},
            "total_population": {"type": "BIGINT", "description": "Total population count", "unit": "Persons"},
            "male_population": {"type": "BIGINT", "description": "Male population count", "unit": "Persons"},
            "female_population": {"type": "BIGINT", "description": "Female population count", "unit": "Persons"},
            "sex_ratio": {"type": "INTEGER", "description": "Females per 1,000 males", "unit": "Females/1000 Males"},
            "literacy_rate": {"type": "NUMERIC", "description": "Overall literacy rate (%)", "unit": "%"},
            "male_literacy_rate": {"type": "NUMERIC", "description": "Male literacy rate (%)", "unit": "%"},
            "female_literacy_rate": {"type": "NUMERIC", "description": "Female literacy rate (%)", "unit": "%"},
            "area_sq_km": {"type": "NUMERIC", "description": "Geographical area in square kilometers", "unit": "Sq Km"}
        }
    },
    "district_health_indicators": {
        "title": "National Family Health Survey (NFHS-5) District Indicators",
        "description": "District-level estimates of institutional births, child immunization, women literacy, sanitation access, and sex ratio at birth from NFHS-5 (2019-21).",
        "reportingPeriods": ["2019-21"],
        "columns": {
            "id": {"type": "INTEGER", "description": "Unique identifier", "unit": "ID"},
            "state_name": {"type": "VARCHAR", "description": "Name of the State/UT", "unit": "Text"},
            "district_name": {"type": "VARCHAR", "description": "Administrative district name", "unit": "Text"},
            "survey_period": {"type": "VARCHAR", "description": "Survey period (2019-21)", "unit": "Period"},
            "institutional_births_pct": {"type": "NUMERIC", "description": "Institutional deliveries (%)", "unit": "%"},
            "children_fully_immunized_pct": {"type": "NUMERIC", "description": "Children 12-23 months fully immunized (%)", "unit": "%"},
            "women_literacy_pct": {"type": "NUMERIC", "description": "Literate women aged 15-49 (%)", "unit": "%"},
            "clean_cooking_fuel_pct": {"type": "NUMERIC", "description": "Households using clean cooking fuel (%)", "unit": "%"},
            "improved_sanitation_pct": {"type": "NUMERIC", "description": "Households with improved sanitation facility (%)", "unit": "%"},
            "sex_ratio_at_birth": {"type": "INTEGER", "description": "Sex ratio at birth (females per 1,000 males)", "unit": "Females/1000 Males"}
        }
    }
}

class SchemaDiscoveryService:
    @staticmethod
    def get_allowed_schemas(force_refresh: bool = False) -> dict:
        global _SCHEMA_CACHE, _CACHE_TIMESTAMP
        current_time = time.time()

        if not force_refresh and _SCHEMA_CACHE and (current_time - _CACHE_TIMESTAMP) < _CACHE_TTL_SECONDS:
            return _SCHEMA_CACHE

        discovered = {}
        allowed_tables = settings.ALLOWED_TABLES

        try:
            with get_readonly_connection() as conn:
                for table_name in allowed_tables:
                    # Introspect columns directly from PostgreSQL information_schema
                    query = text("""
                        SELECT column_name, data_type, is_nullable
                        FROM information_schema.columns
                        WHERE table_schema = 'public' AND table_name = :table_name
                        ORDER BY ordinal_position;
                    """)
                    result = conn.execute(query, {"table_name": table_name}).fetchall()

                    col_info = {}
                    registered_info = METADATA_REGISTRY.get(table_name, {})
                    registered_cols = registered_info.get("columns", {})

                    for row in result:
                        c_name, d_type, is_null = row[0], row[1], row[2]
                        meta = registered_cols.get(c_name, {})
                        col_info[c_name] = {
                            "type": d_type,
                            "isNullable": is_null == "YES",
                            "description": meta.get("description", c_name.replace("_", " ").title()),
                            "unit": meta.get("unit", "")
                        }

                    # Fetch distinct reporting periods
                    periods = registered_info.get("reportingPeriods", [])
                    if not periods:
                        if "reporting_year" in col_info:
                            p_res = conn.execute(text(f"SELECT DISTINCT reporting_year FROM {table_name} ORDER BY reporting_year;")).fetchall()
                            periods = [p[0] for p in p_res]
                        elif "census_year" in col_info:
                            p_res = conn.execute(text(f"SELECT DISTINCT census_year FROM {table_name} ORDER BY census_year;")).fetchall()
                            periods = [str(p[0]) for p in p_res]

                    discovered[table_name] = {
                        "tableName": table_name,
                        "title": registered_info.get("title", table_name),
                        "description": registered_info.get("description", ""),
                        "reportingPeriods": periods,
                        "columns": col_info
                    }

            _SCHEMA_CACHE = discovered
            _CACHE_TIMESTAMP = current_time
            return discovered

        except Exception as e:
            # Fallback to static registry if db connection fails during introspection
            return METADATA_REGISTRY

    @staticmethod
    def get_table_schema_summary(table_name: str) -> str:
        schemas = SchemaDiscoveryService.get_allowed_schemas()
        table_meta = schemas.get(table_name)
        if not table_meta:
            return f"Table '{table_name}' is not in the allowed schema."

        summary_lines = [
            f"Table: {table_name}",
            f"Description: {table_meta.get('description', '')}",
            f"Available Reporting Periods: {', '.join(table_meta.get('reportingPeriods', []))}",
            "Columns:"
        ]
        cols = table_meta.get("columns", {})
        for col_name, col_data in cols.items():
            summary_lines.append(f"  - {col_name} ({col_data.get('type')}, Unit: {col_data.get('unit')}): {col_data.get('description')}")
        return "\n".join(summary_lines)

schema_discovery_service = SchemaDiscoveryService()
