# Security Architecture and Compliance

## 1. Defense-in-Depth Principle

The platform treats the natural-language question, generated SQL, dataset contents, and LLM responses as untrusted inputs. Security is enforced through multiple independent layers rather than relying on prompts.

```
       [ Untrusted User Prompt ]
                  |
                  v
       +--------------------+
       | Prompt Sanitizer   | -> Length bounds, injection pattern guards
       +--------------------+
                  |
                  v
       +--------------------+
       | SQLGlot AST Parser | -> Reject DDL/DML, multi-statements, system schemas
       +--------------------+
                  |
                  v
       +--------------------+
       | Row & Timeout Cap  | -> Injects LIMIT 500 & statement_timeout 5000ms
       +--------------------+
                  |
                  v
+------------------------------------+
|  PostgreSQL Database Permissions   | -> Dedicated 'analyst_readonly' user
|  (REVOKE ALL; GRANT SELECT ONLY)   | -> SET TRANSACTION READ ONLY
+------------------------------------+
                  |
                  v
       +--------------------+
       | Safe CSV Exporter  | -> Formula Injection Neutralization ('=', '+', '-', '@')
       +--------------------+
```

---

## 2. Dedicated Read-Only PostgreSQL Role

All analytical queries are executed exclusively using the `analyst_readonly` role:
```sql
CREATE ROLE analyst_readonly WITH LOGIN PASSWORD 'readonly_secure_pass123' NOSUPERUSER NOCREATEDB NOCREATEROLE;
REVOKE ALL ON SCHEMA public FROM analyst_readonly;
GRANT USAGE ON SCHEMA public TO analyst_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analyst_readonly;
ALTER ROLE analyst_readonly SET default_transaction_read_only = on;
ALTER ROLE analyst_readonly SET statement_timeout = '5000ms';
```
Even if an attacker bypasses the AST parser or LLM guardrails, the database engine returns:
`ERROR: cannot execute INSERT/UPDATE/DELETE in a read-only transaction`.

---

## 3. SQLGlot AST Validation Allowlist

The validator inspects the parsed Abstract Syntax Tree (AST):
- **Permitted Statements:** Only `exp.Select` or read-only `exp.CTE` (`WITH ... SELECT`).
- **Forbidden AST Nodes:** `exp.Insert`, `exp.Update`, `exp.Delete`, `exp.Drop`, `exp.Alter`, `exp.Create`, `exp.Grant`, `exp.Revoke`, `exp.TruncateTable`, `exp.Into` (SELECT INTO).
- **Forbidden Schemas:** `pg_catalog`, `information_schema`, `pg_toast`.
- **Forbidden Functions:** `pg_read_file`, `pg_ls_dir`, `pg_sleep`, `system`, `dblink`.
- **Multi-statement Policy:** `sqlglot.parse` checks expression count; len > 1 is immediately blocked.

---

## 4. CSV Formula Injection Protection (CWE-1236)

When exporting analytical records to CSV, spreadsheet software (Excel, LibreOffice) can execute arbitrary commands if a cell starts with `=`, `+`, `-`, or `@`.
The export utility detects formula triggers:
```javascript
if (/^[=+\-@\t\r]/.test(strVal)) {
  strVal = `'${strVal}`;
}
```
This forces spreadsheet engines to interpret the payload as a literal string.

---

## 5. Authentication and Secret Management
- Passwords hashed using `bcryptjs` with salt rounds 10.
- JWT tokens signed with 32+ character secrets and configured expiration.
- Database passwords and LLM keys managed strictly via `.env` and never returned to the frontend.
