"""
Pydantic Models and DTOs for the AI Analytics Pipeline.
Strict validation for requests, SQL results, chart specs, and grounded explanations.
"""

from typing import Any, Optional, Literal
from pydantic import BaseModel, Field

class AnalysisRequest(BaseModel):
    request_id: Optional[str] = Field(None, description="Unique trace identifier")
    question: str = Field(..., min_length=3, max_length=1000, description="Natural language question from user")
    dataset_id: Optional[str] = Field(None, description="Target dataset identifier")
    table_name: Optional[str] = Field(None, description="Direct table name if pre-selected")
    preferred_language: Literal["en", "hi", "mr"] = Field("en", description="User language preference")
    user_context: Optional[dict[str, Any]] = Field(default_factory=dict)

class SQLValidationResult(BaseModel):
    is_valid: bool
    statement_type: Optional[str] = None
    parsed_sql: Optional[str] = None
    tables_accessed: list[str] = Field(default_factory=list)
    columns_accessed: list[str] = Field(default_factory=list)
    has_limit: bool = False
    row_limit_applied: Optional[int] = None
    violations: list[str] = Field(default_factory=list)
    risk_level: Literal["safe", "low", "medium", "high", "blocked"] = "safe"

class SQLValidationRequest(BaseModel):
    sql: str
    target_table: Optional[str] = None

class SQLExecutionRequest(BaseModel):
    sql: str
    parameters: Optional[dict[str, Any]] = Field(default_factory=dict)
    timeout_ms: Optional[int] = None
    max_rows: Optional[int] = None

class SQLExecutionResult(BaseModel):
    success: bool
    columns: list[str] = Field(default_factory=list)
    column_types: dict[str, str] = Field(default_factory=dict)
    rows: list[dict[str, Any]] = Field(default_factory=list)
    row_count: int = 0
    execution_duration_ms: float = 0.0
    error_message: Optional[str] = None
    truncated: bool = False

class ResultValidationWarning(BaseModel):
    code: str
    severity: Literal["info", "warning", "critical"]
    message: str
    column: Optional[str] = None
    suggestion: Optional[str] = None

class ResultValidationResult(BaseModel):
    is_valid: bool
    warnings: list[ResultValidationWarning] = Field(default_factory=list)
    summary_metrics: dict[str, Any] = Field(default_factory=dict)
    has_comparison_periods: bool = False
    comparison_details: Optional[dict[str, Any]] = None

class ChartSpecification(BaseModel):
    type: Literal["bar", "line", "area", "pie", "scatter", "kpi", "table"]
    title: str
    xKey: Optional[str] = None
    yKey: Optional[str] = None
    xLabel: Optional[str] = None
    yLabel: Optional[str] = None
    unit: Optional[str] = None
    series: list[str] = Field(default_factory=list)
    color_palette: list[str] = Field(default_factory=lambda: ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"])
    recommendation_reason: Optional[str] = None

class ExplanationResponse(BaseModel):
    direct_answer: str
    key_findings: list[str] = Field(default_factory=list)
    calculation_methodology: Optional[str] = None
    assumptions: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)
    provenance_note: str

class AnalysisResponse(BaseModel):
    request_id: str
    interpreted_question: str
    dataset_id: Optional[str] = None
    table_name: str
    generated_sql: str
    sql_validation: SQLValidationResult
    execution_status: Literal["success", "empty_result", "failed", "rejected"]
    result_columns: list[str] = Field(default_factory=list)
    result_rows: list[dict[str, Any]] = Field(default_factory=list)
    row_count: int = 0
    result_validation: ResultValidationResult
    chart_spec: Optional[ChartSpecification] = None
    explanation: ExplanationResponse
    execution_duration_ms: float
    correction_attempts_made: int = 0
    provenance: dict[str, Any] = Field(default_factory=dict)
    error_details: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    database: dict[str, Any]
    llm_provider: str
    allowed_tables: list[str]
    timestamp: str
