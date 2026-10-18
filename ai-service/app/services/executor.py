"""
Safe Database Execution Service.
Executes pre-validated queries exclusively through the analyst_readonly account.
Enforces read-only transactions, statement timeouts, and row bounding.
"""

import time
from decimal import Decimal
from datetime import date, datetime
from sqlalchemy import text
from app.core.database import get_readonly_connection
from app.core.config import settings
from app.schemas.models import SQLExecutionResult

class SQLExecutor:
    @staticmethod
    def execute(sql: str, parameters: dict = None, max_rows: int = None) -> SQLExecutionResult:
        max_rows = max_rows or settings.SQL_MAX_ROWS
        start_time = time.time()
        parameters = parameters or {}

        try:
            with get_readonly_connection() as conn:
                # Execute parameterized query
                result = conn.execute(text(sql), parameters)
                
                columns = list(result.keys()) if result.returns_rows else []
                raw_rows = result.fetchmany(max_rows + 1) if result.returns_rows else []
                
                duration_ms = round((time.time() - start_time) * 1000, 2)

                # Check if result set exceeded max_rows
                truncated = len(raw_rows) > max_rows
                if truncated:
                    raw_rows = raw_rows[:max_rows]

                # Convert to JSON-serializable dictionaries
                formatted_rows = []
                col_types = {}
                for row in raw_rows:
                    row_dict = {}
                    for idx, col in enumerate(columns):
                        val = row[idx]
                        if isinstance(val, Decimal):
                            row_dict[col] = float(val)
                            col_types[col] = "number"
                        elif isinstance(val, (int, float)):
                            row_dict[col] = val
                            col_types[col] = "number"
                        elif isinstance(val, (date, datetime)):
                            row_dict[col] = val.isoformat()
                            col_types[col] = "datetime"
                        elif val is None:
                            row_dict[col] = None
                        else:
                            row_dict[col] = str(val)
                            if col not in col_types:
                                col_types[col] = "string"
                    formatted_rows.append(row_dict)

                return SQLExecutionResult(
                    success=True,
                    columns=columns,
                    column_types=col_types,
                    rows=formatted_rows,
                    row_count=len(formatted_rows),
                    execution_duration_ms=duration_ms,
                    truncated=truncated
                )

        except Exception as e:
            duration_ms = round((time.time() - start_time) * 1000, 2)
            # Mask internal connection strings or technical credentials
            clean_error = str(e).split("\n")[0]
            if "read-only transaction" in clean_error:
                clean_error = "Execution blocked: Write operations are forbidden on the read-only analytics database."
            elif "statement timeout" in clean_error:
                clean_error = f"Execution timed out: The query exceeded the {settings.SQL_STATEMENT_TIMEOUT_MS}ms execution budget."

            return SQLExecutionResult(
                success=False,
                columns=[],
                rows=[],
                row_count=0,
                execution_duration_ms=duration_ms,
                error_message=clean_error
            )

sql_executor = SQLExecutor()
