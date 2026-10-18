"""
Unit Tests for Pandas-based Result Validator.
Tests empty results, null detection, zero denominator handling, and comparison periods.
"""

from app.analytics.result_validator import ResultValidator

def test_empty_results_flagged():
    res = ResultValidator.validate([], expected_analysis_type="ranking")
    assert res.is_valid is False
    assert any(w.code == "EMPTY_RESULT_SET" for w in res.warnings)

def test_null_values_flagged():
    rows = [
        {"district_name": "District A", "rate": 5.2},
        {"district_name": "District B", "rate": None},
        {"district_name": "District C", "rate": 4.8}
    ]
    res = ResultValidator.validate(rows, expected_analysis_type="ranking")
    assert any(w.code == "NULL_VALUES_DETECTED" and w.column == "rate" for w in res.warnings)

def test_valid_comparison_period_results():
    rows = [
        {"district_name": "District A", "value_2021_22": 5.0, "value_2022_23": 6.5, "absolute_change": 1.5, "relative_pct_change": 30.0},
        {"district_name": "District B", "value_2021_22": 4.0, "value_2022_23": 5.0, "absolute_change": 1.0, "relative_pct_change": 25.0}
    ]
    res = ResultValidator.validate(rows, expected_analysis_type="trend_change")
    assert res.is_valid is True
    assert res.has_comparison_periods is True
    assert res.comparison_details["hasAbsoluteChange"] is True

def test_zero_denominator_handled():
    rows = [
        {"district_name": "District Zero", "value_2021_22": 0.0, "value_2022_23": 4.0, "absolute_change": 4.0, "relative_pct_change": None}
    ]
    res = ResultValidator.validate(rows, expected_analysis_type="trend_change")
    assert any(w.code == "ZERO_DENOMINATOR_HANDLED" for w in res.warnings)
