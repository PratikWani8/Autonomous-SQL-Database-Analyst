# Autonomous SQL Database Analyst
### Production-Grade AI Analytics Agent for Structured Indian Public Datasets

[![Tests](https://img.shields.io/badge/tests-all%20passing-brightgreen)](#testing)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Read--Only%20Enforced-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/license-OGDL--India-blue)](https://data.gov.in/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-teal)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)

The **Autonomous SQL Database Analyst** translates natural-language public policy questions into safe, optimized PostgreSQL queries against authentic Indian government datasets. It autonomously inspects database schemas, parses user intent, enforces strict Abstract Syntax Tree (AST) query safety, executes queries under read-only database roles, audits returned data quality, renders interactive Recharts visualizations, and produces evidence-grounded explanations.

---

## 1. System Architecture

```
+---------------------------------------------------------------------------------+
|                             CLIENT TIER (React + Vite)                          |
|   - AI Query Workspace     - Dynamic Recharts Renderer     - Dataset Explorer    |
|   - History & Insights     - Protected Session Context      - Safe CSV Export     |
+----------------------------------------+----------------------------------------+
                                         | HTTPS / REST
                                         v
+---------------------------------------------------------------------------------+
|                        APPLICATION GATEWAY (Node.js + Express)                  |
|   - JWT Authentication & Bcrypt Hashing     - Helmet Security Headers           |
|   - Rate Limiting (express-rate-limit)      - User Ownership & History Access   |
|   - Request ID Tracing                      - Mongoose ODM (Metadata)           |
+--------------------+------------------------------------+-----------------------+
                     |                                    |
     Metadata / Auth | Mongoose                           | Internal REST Proxy
                     v                                    v (X-Internal-Service-Key)
+------------------------------+     +--------------------------------------------+
|      METADATA DATABASE       |     |           AI SERVICE (FastAPI)             |
|          (MongoDB)           |     |  1. Intent Analysis & Metric Detection     |
| - Users & Preferences        |     |  2. Schema Discovery (Cached)              |
| - Query Audit History        |     |  3. SQL Generation (Deterministic / LLM)   |
| - Saved Policy Insights      |     |  4. SQLGlot AST Validation & Policy        |
| - Public Dataset Catalogs    |     |  5. Pandas Result Quality Validation       |
+------------------------------+     |  6. Recharts Spec Recommendation           |
                                     |  7. Evidence-Grounded Explanations         |
                                     +--------------------+-----------------------+
                                                          |
                                        SQLAlchemy Pool   | (analyst_readonly user)
                                        Read-Only Trx     | Statement Timeout: 5000ms
                                                          v
                                     +--------------------------------------------+
                                     |             ANALYTICS DATABASE             |
                                     |                (PostgreSQL)                |
                                     |  - district_unemployment_stats (PLFS)      |
                                     |  - district_demographics_stats (Census)    |
                                     |  - district_health_indicators (NFHS-5)     |
                                     +--------------------------------------------+
```

---

## 2. Integrated Indian Public Datasets

All datasets originate from official government publications complying with the **Open Government Data License - India (OGDL-India)**.

| Table Name | Description | Source Agency | Time Periods | Key Indicators |
|---|---|---|---|---|
| `district_unemployment_stats` | District Labour Force Participation & Unemployment | MoSPI / PLFS (data.gov.in) | `2021-22`, `2022-23` | Rural/Urban/Overall Unemployment (%), LFPR, WPR |
| `district_demographics_stats` | Decennial Census Population, Literacy & Sex Ratio | Census of India / MoHA | `2001`, `2011` | Total Population, Male/Female, Sex Ratio, Literacy % |
| `district_health_indicators` | National Family Health Survey (NFHS-5) Indicators | MoHFW / IIPS | `2019-21` | Institutional Births %, Child Immunization %, Sanitation % |

---

## 3. Mandatory Security & Defense-in-Depth

1. **Dedicated Read-Only Role (`analyst_readonly`):**
   - Direct database-level permission restriction (`REVOKE ALL ON SCHEMA public FROM analyst_readonly; GRANT USAGE, SELECT ON ALL TABLES`).
   - All analytical transactions execute with `SET TRANSACTION READ ONLY;`.
   - Hard database-level `statement_timeout = '5000ms'`.
   - Write operations (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`) are structurally rejected by PostgreSQL.
2. **SQLGlot AST Parsing & Validation:**
   - Enforces a single statement per query (rejects semicolons followed by other commands).
   - Only `SELECT` or read-only `WITH` (CTE) expressions are permitted.
   - Denylists access to system tables (`pg_catalog`, `information_schema`, `pg_roles`, etc.).
   - Denylists dangerous functions (`pg_read_file`, `pg_sleep`, etc.).
   - Clamps or injects `LIMIT 500`.
3. **CSV Formula Injection Neutralization (CWE-1236):**
   - Sanitizes exported CSV records by prefixing `=cmd`, `+`, `-`, or `@` with a single quote (`'`).
4. **Zero AI Hallucinations:**
   - Numerical claims and summaries are strictly bound to returned PostgreSQL result rows and deterministic computations.

---

## 4. Prerequisites

- **Node.js**: v18+ or v20+ (Tested on v24.9.0)
- **Python**: 3.10+ (Tested on v3.13.7)
- **PostgreSQL**: 14+ (Installed on port 5432)
- **MongoDB**: 6.0+ (Installed on port 27017)
- *(Optional)* Docker & Docker Compose

---

## 5. Local Setup Instructions

### Step 1: Clone and Configure Environment
Copy the configuration template:
```bash
cp .env.example .env
```
Ensure PostgreSQL has the `postgres` user password configured (`password` or as set in your local server).

### Step 2: Ingest Indian Public Datasets & Create Database
Run the ingestion pipeline script to create the database `indian_public_data`, define tables, create the read-only user `analyst_readonly`, insert verified records, and register metadata in MongoDB:
```bash
python database/scripts/generate_seed_csvs.py
python database/scripts/ingest_datasets.py
```
*Output: Ingestion report created at `datasets/ingestion_report.md`.*

### Step 3: Start Python AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
*Health Check: `http://localhost:8000/health`*

### Step 4: Start Node.js Express Gateway
In a new terminal:
```bash
cd server
npm install
npm start
```
*Health Check: `http://localhost:5000/api/health`*

### Step 5: Start React Frontend
In a new terminal:
```bash
cd client
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 6. Testing

The codebase includes full automated test suites across all tiers.

### Run Python AI Service Tests (pytest):
```bash
cd ai-service
pytest -v
```
*Validates: AST parsing, DDL/DML rejection, single-statement enforcement, table allowlisting, pandas null audit, division-by-zero checks, and live PostgreSQL queries.*

### Run Express Backend Tests (Jest):
```bash
cd server
npm test
```
*Validates: JWT auth lifecycle, duplicate email rejection, dataset schema access, query input bounds, and security headers.*

### Run React Client Tests (Vitest):
```bash
cd client
npx vitest run
```
*Validates: CSV formula injection neutralization, Indian number formatters, and clean column label transformations.*

---

## 7. Hackathon 10-Step Demonstration Script

Follow this reproducible flow to demonstrate the platform:

1. **Step 1: Sign in or Register**
   - Navigate to `http://localhost:5173/register` and create an account (`Dr. Rajesh Sharma`, `analyst@example.com`, `Password123!`).
2. **Step 2: Inspect Datasets in Explorer**
   - Open **Dataset Explorer**. Inspect `district_unemployment_stats` and view the 20-row live PostgreSQL preview.
3. **Step 3: Ask a Temporal Trend Question**
   - Open **AI Query Workspace**. Select `District-wise Labour Force Participation and Unemployment Rates`.
   - Submit:
     > *"Which five districts experienced the largest increase in overall unemployment rate between 2021-22 and 2022-23?"*
4. **Step 4: Observe 7-Stage Pipeline Progression**
   - The UI visualizes: Intent Analysis -> Schema Discovery -> SQL Generation -> AST Safety Verification -> Read-Only DB Execution -> Pandas Result Validation -> Visual Insights.
5. **Step 5: Inspect Generated SQL and Safety Badges**
   - Click "Copy SQL" to view the generated PostgreSQL CTE. Observe `AST Verified (Safe)` and `LIMIT 5` enforcement.
6. **Step 6: Inspect Grounded Explanation**
   - The model highlights the top district (e.g. `Amravati` or `Nanded`) with exact point differences and relative growth percentages without hallucinations.
7. **Step 7: Switch Visualization Types**
   - Switch between **Bar**, **Line**, and **Area** charts using the interactive switcher in the Recharts viewer.
8. **Step 8: Save Insight**
   - Click **Save Insight**, enter a custom note, and save it to your gallery.
9. **Step 9: Test Malicious Query Rejection (Safety Verification)**
   - Enter an unsafe instruction:
     > *"Delete all records from district_unemployment_stats; DROP TABLE district_health_indicators;"*
   - Observe that the AST Safety Engine immediately halts the query and marks it as `Policy Blocked`.
10. **Step 10: Export Safe CSV**
    - Click **Export CSV** on any result table to download a spreadsheet-ready file protected against formula injection.
