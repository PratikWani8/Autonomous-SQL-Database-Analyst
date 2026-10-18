"""
Strict SQL AST Validator using SQLGlot.
Enforces allowlist-based security policy, single-statement restrictions,
schema boundary protections, and automated row limits.
"""

import sqlglot
from sqlglot import exp
from app.core.config import settings
from app.schemas.models import SQLValidationResult

DISALLOWED_EXPRESSIONS = (
    exp.Insert,
    exp.Update,
    exp.Delete,
    exp.Drop,
    exp.Alter,
    exp.Create,
    exp.Command,
    exp.Grant,
    exp.Revoke,
    exp.TruncateTable,
    exp.Into,  # Blocks SELECT ... INTO
)

DISALLOWED_SCHEMAS = {
    "pg_catalog",
    "information_schema",
    "pg_toast",
}

DISALLOWED_SYSTEM_TABLES = {
    "pg_roles", "pg_shadow", "pg_authid", "pg_user", "pg_database",
    "pg_tables", "pg_stat_activity", "pg_proc", "pg_class"
}

DANGEROUS_FUNCTIONS = {
    "pg_read_file", "pg_read_binary_file", "pg_ls_dir", "pg_stat_file",
    "pg_sleep", "pg_sleep_for", "pg_sleep_until", "query_to_xml",
    "version", "current_setting", "set_config", "system", "dblink", "dblink_exec"
}

class SQLValidator:
    def __init__(self, allowed_tables: list[str] = None, max_rows: int = None):
        self.allowed_tables = set(allowed_tables or settings.ALLOWED_TABLES)
        self.max_rows = max_rows or settings.SQL_MAX_ROWS

    def validate(self, sql_query: str, target_table: str = None) -> SQLValidationResult:
        violations = []
        tables_accessed = set()
        columns_accessed = set()
        has_limit = False
        row_limit_applied = None

        clean_sql = sql_query.strip()
        if not clean_sql:
            return SQLValidationResult(
                is_valid=False,
                violations=["SQL query cannot be empty"],
                risk_level="blocked"
            )

        # 1. Check for multiple statements (reject semicolons followed by other commands)
        try:
            parsed_expressions = sqlglot.parse(clean_sql, read="postgres")
        except Exception as e:
            return SQLValidationResult(
                is_valid=False,
                violations=[f"SQL syntax parsing error: {str(e)}"],
                risk_level="blocked"
            )

        if not parsed_expressions:
            return SQLValidationResult(
                is_valid=False,
                violations=["No valid SQL statements found"],
                risk_level="blocked"
            )

        if len(parsed_expressions) > 1:
            return SQLValidationResult(
                is_valid=False,
                violations=["Multiple SQL statements are strictly forbidden"],
                risk_level="blocked"
            )

        root = parsed_expressions[0]

        # 2. Check for Disallowed Top-Level Statements
        if isinstance(root, DISALLOWED_EXPRESSIONS):
            return SQLValidationResult(
                is_valid=False,
                statement_type=type(root).__name__,
                violations=[f"Data-modifying or DDL statements ({type(root).__name__}) are strictly rejected"],
                risk_level="blocked"
            )

        # Only allow Select or Expression with CTE leading to Select
        if not isinstance(root, exp.Select):
            return SQLValidationResult(
                is_valid=False,
                statement_type=type(root).__name__,
                violations=[f"Only read-only SELECT queries are permitted (received {type(root).__name__})"],
                risk_level="blocked"
            )

        # 3. Deep AST Traversal: Inspect for embedded mutations, disallowed schemas, CTE mutations
        for node in root.walk():
            # Check for any nested DML / DDL in subqueries or CTEs
            if isinstance(node, DISALLOWED_EXPRESSIONS):
                violations.append(f"Disallowed nested statement: {type(node).__name__}")

            # Check for table accesses
            if isinstance(node, exp.Table):
                table_name = node.name.lower()
                db_schema = (node.db or "").lower()

                # Schema checks
                if db_schema in DISALLOWED_SCHEMAS:
                    violations.append(f"Access to restricted system schema '{db_schema}' is forbidden")

                if table_name in DISALLOWED_SYSTEM_TABLES:
                    violations.append(f"Access to system catalog table '{table_name}' is forbidden")

                # If table is not a CTE alias and not in allowed tables
                cte_names = {cte.alias_or_name.lower() for cte in root.find_all(exp.CTE)}
                if table_name not in cte_names:
                    tables_accessed.add(table_name)
                    if self.allowed_tables and table_name not in self.allowed_tables:
                        violations.append(f"Access to unauthorized table '{table_name}'. Allowed tables: {list(self.allowed_tables)}")

            # Check for function calls
            if isinstance(node, (exp.Anonymous, exp.Func)):
                func_name = (node.name or "").lower()
                if func_name in DANGEROUS_FUNCTIONS:
                    violations.append(f"Dangerous or administrative function '{func_name}()' is blocked")

            # Check for columns
            if isinstance(node, exp.Column):
                columns_accessed.add(node.name.lower())

        # 4. Limit Clause Inspection & Safe Clamping
        limit_expr = root.find(exp.Limit)
        if limit_expr:
            has_limit = True
            try:
                limit_val = int(limit_expr.expression.name)
                if limit_val > self.max_rows:
                    limit_expr.set("expression", exp.Literal.number(self.max_rows))
                    row_limit_applied = self.max_rows
                else:
                    row_limit_applied = limit_val
            except Exception:
                limit_expr.set("expression", exp.Literal.number(self.max_rows))
                row_limit_applied = self.max_rows
        else:
            # Append LIMIT clause directly into AST
            root = root.limit(self.max_rows)
            has_limit = True
            row_limit_applied = self.max_rows

        # Format standardized PostgreSQL SQL
        final_sql = root.sql(dialect="postgres")

        is_valid = len(violations) == 0
        risk_level = "safe" if is_valid else "blocked"

        return SQLValidationResult(
            is_valid=is_valid,
            statement_type="SELECT",
            parsed_sql=final_sql if is_valid else None,
            tables_accessed=sorted(list(tables_accessed)),
            columns_accessed=sorted(list(columns_accessed)),
            has_limit=has_limit,
            row_limit_applied=row_limit_applied,
            violations=violations,
            risk_level=risk_level
        )

# Global validator instance
sql_validator = SQLValidator()
