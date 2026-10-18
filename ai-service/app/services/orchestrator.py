"""
AI Analytics Pipeline Orchestrator.
Coordinates the end-to-end analytical workflow:
Question -> Intent -> Schema -> SQL Gen -> AST Validation -> Safe Execution -> Result Validation -> Viz -> Explanation.
Includes bounded correction attempts on syntax/schema failures.
"""

import uuid
import time
from typing import Optional
from app.schemas.models import (
    AnalysisRequest, AnalysisResponse, ExplanationResponse,
    SQLValidationResult, ResultValidationResult
)
from app.services.intent_parser import intent_parser
from app.services.schema_discovery import schema_discovery_service, METADATA_REGISTRY
from app.sql.validator import sql_validator
from app.services.executor import sql_executor
from app.analytics.result_validator import result_validator
from app.visualization.spec_generator import vis_spec_generator
from app.services.llm_adapter import get_llm_adapter
from app.core.config import settings

class AnalysisOrchestrator:
    @staticmethod
    def process(request: AnalysisRequest) -> AnalysisResponse:
        total_start = time.time()
        request_id = request.request_id or str(uuid.uuid4())
        llm = get_llm_adapter()

        # Step 1: Intent Analysis & Pre-selection
        intent = intent_parser.parse(request.question, preselected_table=request.table_name)
        target_table = intent.target_table

        # Step 2: Schema Discovery
        schema_discovery_service.get_allowed_schemas()
        table_meta = METADATA_REGISTRY.get(target_table, {})

        # Step 3 & 4: SQL Generation & AST Validation with Bounded Correction
        attempts = 0
        max_attempts = settings.MAX_CORRECTION_ATTEMPTS
        generated_sql = ""
        val_result: Optional[SQLValidationResult] = None

        while attempts <= max_attempts:
            attempts += 1
            raw_sql, parsed_intent = llm.generate_sql(request.question, table_name=target_table)
            generated_sql = raw_sql

            # Validate generated SQL using SQLGlot AST
            val_result = sql_validator.validate(generated_sql, target_table=target_table)
            if val_result.is_valid:
                generated_sql = val_result.parsed_sql
                break
            else:
                # If invalid and attempts remain, try fallback generator
                if attempts <= max_attempts:
                    pass

        # If still invalid after attempts, return blocked response
        if not val_result or not val_result.is_valid:
            duration = round((time.time() - total_start) * 1000, 2)
            return AnalysisResponse(
                request_id=request_id,
                interpreted_question=intent.interpreted_summary,
                dataset_id=request.dataset_id,
                table_name=target_table,
                generated_sql=generated_sql,
                sql_validation=val_result or SQLValidationResult(is_valid=False, violations=["SQL generation failed"]),
                execution_status="rejected",
                result_columns=[],
                result_rows=[],
                row_count=0,
                result_validation=ResultValidationResult(is_valid=False),
                chart_spec=None,
                explanation=ExplanationResponse(
                    direct_answer="Analysis could not proceed because the generated query violates database safety policies.",
                    key_findings=["The query violated safe SQL parsing rules."],
                    calculation_methodology=None,
                    assumptions=[],
                    limitations=val_result.violations if val_result else ["Unknown violation"],
                    provenance_note="Security Enforcement Layer."
                ),
                execution_duration_ms=duration,
                correction_attempts_made=attempts - 1,
                error_details="; ".join(val_result.violations) if val_result else "Validation error"
            )

        # Step 5: Safe Read-Only Database Execution
        exec_res = sql_executor.execute(generated_sql, max_rows=settings.SQL_MAX_ROWS)
        if not exec_res.success:
            duration = round((time.time() - total_start) * 1000, 2)
            return AnalysisResponse(
                request_id=request_id,
                interpreted_question=intent.interpreted_summary,
                dataset_id=request.dataset_id,
                table_name=target_table,
                generated_sql=generated_sql,
                sql_validation=val_result,
                execution_status="failed",
                result_columns=[],
                result_rows=[],
                row_count=0,
                result_validation=ResultValidationResult(is_valid=False),
                chart_spec=None,
                explanation=ExplanationResponse(
                    direct_answer="The analytical query encountered an execution error in PostgreSQL.",
                    key_findings=[f"Database returned: {exec_res.error_message}"],
                    assumptions=[],
                    limitations=["Database execution failed."],
                    provenance_note="PostgreSQL Analytics Engine."
                ),
                execution_duration_ms=duration,
                correction_attempts_made=attempts - 1,
                error_details=exec_res.error_message
            )

        rows = exec_res.rows
        columns = exec_res.columns

        # Step 6: Post-Execution Result Validation (Pandas)
        res_validation = result_validator.validate(rows, expected_analysis_type=intent.analysis_type)

        # Step 7: Visualization Recommendation
        chart_spec = vis_spec_generator.generate_spec(
            rows=rows,
            question=request.question,
            analysis_type=intent.analysis_type,
            target_metric=intent.target_metric
        )

        # Step 8: Evidence-Grounded Explanation
        explanation_dict = llm.generate_explanation(
            question=request.question,
            sql=generated_sql,
            rows=rows,
            metrics=res_validation.summary_metrics
        )
        explanation = ExplanationResponse(**explanation_dict)

        duration = round((time.time() - total_start) * 1000, 2)
        exec_status = "empty_result" if len(rows) == 0 else "success"

        return AnalysisResponse(
            request_id=request_id,
            interpreted_question=intent.interpreted_summary,
            dataset_id=request.dataset_id,
            table_name=target_table,
            generated_sql=generated_sql,
            sql_validation=val_result,
            execution_status=exec_status,
            result_columns=columns,
            result_rows=rows,
            row_count=len(rows),
            result_validation=res_validation,
            chart_spec=chart_spec,
            explanation=explanation,
            execution_duration_ms=duration,
            correction_attempts_made=attempts - 1,
            provenance={
                "datasetTitle": table_meta.get("title", target_table),
                "source": "Open Government Data Platform India (data.gov.in) & MoSPI",
                "license": "Open Government Data License - India (OGDL-India)",
                "databaseRole": "analyst_readonly",
                "llmEngine": settings.LLM_PROVIDER
            }
        )

orchestrator = AnalysisOrchestrator()
