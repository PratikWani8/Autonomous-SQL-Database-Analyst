"""
FastAPI Internal Service Endpoints.
Provides individual testable pipeline services as well as the unified analysis orchestrator.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Header, HTTPException, status
from app.schemas.models import (
    AnalysisRequest, AnalysisResponse,
    SQLValidationRequest, SQLValidationResult,
    SQLExecutionRequest, SQLExecutionResult,
    ResultValidationResult, HealthResponse
)
from app.core.config import settings
from app.core.database import test_db_connection
from app.sql.validator import sql_validator
from app.services.executor import sql_executor
from app.analytics.result_validator import result_validator
from app.services.orchestrator import orchestrator
from app.services.llm_adapter import get_llm_adapter

router = APIRouter()

def verify_service_token(x_internal_service_key: str = Header(None)):
    """Verifies internal service token for secure microservice communication."""
    if settings.INTERNAL_SERVICE_KEY:
        if not x_internal_service_key or x_internal_service_key != settings.INTERNAL_SERVICE_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized: Invalid internal service token"
            )

@router.post("/internal/analyze", response_model=AnalysisResponse)
def analyze_question(request: AnalysisRequest, x_internal_service_key: str = Header(None)):
    verify_service_token(x_internal_service_key)
    return orchestrator.process(request)

@router.post("/internal/sql/validate", response_model=SQLValidationResult)
def validate_sql(request: SQLValidationRequest, x_internal_service_key: str = Header(None)):
    verify_service_token(x_internal_service_key)
    return sql_validator.validate(request.sql, target_table=request.target_table)

@router.post("/internal/sql/execute", response_model=SQLExecutionResult)
def execute_sql(request: SQLExecutionRequest, x_internal_service_key: str = Header(None)):
    verify_service_token(x_internal_service_key)
    # Validate before executing
    val = sql_validator.validate(request.sql)
    if not val.is_valid:
        return SQLExecutionResult(
            success=False,
            columns=[],
            rows=[],
            row_count=0,
            error_message="; ".join(val.violations)
        )
    return sql_executor.execute(val.parsed_sql, parameters=request.parameters, max_rows=request.max_rows)

@router.post("/internal/results/validate", response_model=ResultValidationResult)
def validate_results(rows: list[dict], x_internal_service_key: str = Header(None)):
    verify_service_token(x_internal_service_key)
    return result_validator.validate(rows)

@router.get("/health", response_model=HealthResponse)
def health_check():
    db_status = test_db_connection()
    service_status = "healthy" if db_status.get("status") == "connected" else "degraded"
    return HealthResponse(
        status=service_status,
        database=db_status,
        llm_provider=settings.LLM_PROVIDER,
        allowed_tables=settings.ALLOWED_TABLES,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
