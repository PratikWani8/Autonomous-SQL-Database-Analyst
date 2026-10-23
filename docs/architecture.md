# System Architecture & Trust Boundaries

## 1. High-Level Architecture Overview

The **Autonomous SQL Database Analyst** is engineered as a zero-trust, multi-tier platform decoupling natural-language orchestration, strict AST security validation, database execution, and metadata persistence.

```
+-------------------------------------------------------------------------------+
|                             CLIENT TIER (React + Vite)                        |
|   - AI Query Workspace     - Dynamic Recharts Renderer    - Dataset Explorer  |
|   - History & Insights     - Protected Session Context     - Safe CSV Export   |
+---------------------------------------+---------------------------------------+
                                        | HTTPS / REST
                                        v
+-------------------------------------------------------------------------------+
|                       APPLICATION GATEWAY (Node.js + Express)                 |
|   - JWT Authentication & Bcrypt Hashing    - Helmet Security Headers          |
|   - Rate Limiting (express-rate-limit)     - User Ownership & History Access  |
|   - Request ID Tracing                     - Mongoose ODM (Metadata)          |
+-------------------+-----------------------------------+-----------------------+
                    |                                   |
    Metadata / Auth | Mongoose                          | Internal REST Proxy
                    v                                   v (X-Internal-Service-Key)
+-----------------------------+     +-------------------------------------------+
|      METADATA DATABASE      |     |          AI SERVICE (FastAPI)             |
|          (MongoDB)          |     |  1. Intent Analysis & Metric Detection    |
| - Users & Preferences       |     |  2. Schema Discovery (Cached)             |
| - Query Audit History       |     |  3. SQL Generation (Deterministic / LLM)  |
| - Saved Policy Insights     |     |  4. SQLGlot AST Validation & Policy       |
| - Public Dataset Catalogs   |     |  5. Pandas Result Quality Validation      |
+-----------------------------+     |  6. Recharts Spec Recommendation          |
                                    |  7. Evidence-Grounded Explanations        |
                                    +-------------------+-----------------------+
                                                        |
                                       SQLAlchemy Pool  | (analyst_readonly user)
                                       Read-Only Trx    | Statement Timeout: 5000ms
                                                        v
                                    +-------------------------------------------+
                                    |            ANALYTICS DATABASE             |
                                    |               (PostgreSQL)                |
                                    |  - district_unemployment_stats (PLFS)     |
                                    |  - district_demographics_stats (Census)   |
                                    |  - district_health_indicators (NFHS-5)    |
                                    +-------------------------------------------+
```

---

## 2. The 9-Stage Analytical Workflow

1. **User Ingestion & Sanitization:** Receives natural-language query in English, Hindi, or Marathi with target dataset preferences.
2. **Intent Analysis:** Semantic parsing detects requested metric, temporal comparison needs (absolute vs relative percentage change), filters (State), sorting order, and limits.
3. **Schema Discovery:** Introspects allowed PostgreSQL catalogs using cached schema metadata with descriptions and units.
4. **SQL Generation:** Translates intent into PostgreSQL dialect using robust CTE patterns and division-by-zero guards.
5. **SQLGlot AST Validation:**
   - Enforces single statement (rejects multiple statements separated by semicolons).
   - Enforces `SELECT` or read-only `WITH` (CTE) expressions only.
   - Strictly blocks: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `TRUNCATE`, `GRANT`, `REVOKE`, `SELECT INTO`, `EXECUTE`, `COPY`.
   - Blocks unauthorized tables and system catalogs (`pg_catalog`, `information_schema`, `pg_roles`).
   - Blocks hazardous functions (`pg_read_file`, `pg_sleep`, etc.).
   - Clamps/injects `LIMIT 500`.
6. **Safe Read-Only Execution:** Executes approved AST through SQLAlchemy using dedicated PostgreSQL user `analyst_readonly` under `SET TRANSACTION READ ONLY;` and statement timeout `5000ms`.
7. **Pandas Result Validation:** Audits returned rows for nulls, division-by-zero indicators, missing comparison periods, and scale anomalies.
8. **Visualization Recommendation:** Determines best-fit Recharts configuration (`bar`, `line`, `area`, `pie`, `kpi`, `table`).
9. **Evidence-Grounded Explanation:** Constructs transparent findings citing exact figures, units, methodology, assumptions, limitations, and dataset provenance.

---

## 3. Trust Boundaries & Security Enclaves

| Boundary | Interacting Components | Enforced Controls |
|---|---|---|
| **Client <-> Express Gateway** | React Client <-> Node.js Server | CORS whitelist, JWT signature verification, Helmet headers, IP rate limiting, input validation. |
| **Express <-> FastAPI AI Service** | Node.js Server <-> FastAPI | Private network communication, shared `X-Internal-Service-Key` token, shared `X-Request-ID` correlation header. |
| **AI Service <-> PostgreSQL** | FastAPI <-> Analytics Database | Dedicated non-superuser `analyst_readonly`, `REVOKE ALL ON SCHEMA public`, `SET TRANSACTION READ ONLY;`, statement timeout 5000ms, max 500 rows. |
| **AI Service <-> LLM Provider** | FastAPI <-> LLM / Deterministic Engine | Zero credentials exposed to frontend, prompt injection resistance, strict JSON schema parsing, deterministic offline fallback. |
