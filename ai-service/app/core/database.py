"""
SQLAlchemy Read-Only Database Connection Pool and Execution Interface.
Connects ONLY using the dedicated analyst_readonly user.
"""

from contextlib import contextmanager
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Engine configuration with statement_timeout enforcement in connect_args
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=1800,
    connect_args={
        "options": f"-c statement_timeout={settings.SQL_STATEMENT_TIMEOUT_MS}ms"
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

@contextmanager
def get_readonly_connection():
    """
    Context manager that yields a raw connection with explicit READ ONLY enforcement.
    """
    with engine.connect() as connection:
        # Enforce read-only at session/transaction level as defense-in-depth
        connection.execute(text("SET TRANSACTION READ ONLY;"))
        try:
            yield connection
        finally:
            connection.rollback()  # Always rollback to avoid hanging transactions

def test_db_connection() -> dict:
    """
    Checks database connectivity and verifies read-only status.
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT current_user, current_setting('transaction_read_only');"))
            row = result.fetchone()
            return {
                "status": "connected",
                "user": row[0] if row else None,
                "is_read_only": row[1] if row else None
            }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
