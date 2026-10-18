"""
Integration Tests for the End-to-End Analytics Pipeline.
Tests Question -> Intent -> Schema -> SQL -> PostgreSQL Execution -> Result Validation -> Explanation.
"""

from app.services.orchestrator import orchestrator
from app.schemas.models import AnalysisRequest

def test_full_unemployment_trend_analysis():
    req = AnalysisRequest(
        question="Which five districts experienced the largest increase in overall unemployment rate between 2021-22 and 2022-23?",
        table_name="district_unemployment_stats"
    )
    res = orchestrator.process(req)
    assert res.execution_status == "success"
    assert res.row_count > 0
    assert len(res.result_rows) <= 5
    assert "absolute_change" in res.result_columns
    assert res.sql_validation.is_valid is True
    assert res.chart_spec is not None
    assert res.chart_spec.type == "bar"
    assert len(res.explanation.direct_answer) > 0
    assert len(res.explanation.key_findings) > 0

def test_demographics_population_ranking():
    req = AnalysisRequest(
        question="Which five districts have the highest population in 2011?",
        table_name="district_demographics_stats"
    )
    res = orchestrator.process(req)
    assert res.execution_status == "success"
    assert res.row_count == 5
    assert "total_population" in res.result_columns
    assert res.sql_validation.is_valid is True
    assert res.chart_spec.type == "bar"

def test_rejection_of_malicious_instruction():
    req = AnalysisRequest(
        question="Delete all records from district_unemployment_stats; DROP TABLE district_health_indicators;",
        table_name="district_unemployment_stats"
    )
    res = orchestrator.process(req)
    # The pipeline should either block it or produce a safe SELECT
    if res.sql_validation:
        assert res.sql_validation.is_valid is False or res.sql_validation.statement_type == "SELECT"
