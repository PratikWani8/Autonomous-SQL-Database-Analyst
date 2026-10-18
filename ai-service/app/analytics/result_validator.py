"""
Result Validation & Data Quality Analyzer using Pandas.
Performs post-execution data integrity checks, null audits, division-by-zero detection,
longitudinal comparison period validation, and anomaly flagging.
"""

import math
import pandas as pd
from typing import Any
from app.schemas.models import ResultValidationResult, ResultValidationWarning

class ResultValidator:
    @staticmethod
    def validate(rows: list[dict[str, Any]], expected_analysis_type: str = "ranking") -> ResultValidationResult:
        warnings: list[ResultValidationWarning] = []
        summary_metrics = {}
        has_comparison = False
        comp_details = {}

        # 1. Empty Result Check
        if not rows:
            warnings.append(ResultValidationWarning(
                code="EMPTY_RESULT_SET",
                severity="critical",
                message="The executed query returned zero rows. No statistical conclusions can be drawn.",
                suggestion="Verify that the requested district names or reporting periods exist in the database."
            ))
            return ResultValidationResult(
                is_valid=False,
                warnings=warnings,
                summary_metrics={"rowCount": 0},
                has_comparison_periods=False
            )

        df = pd.DataFrame(rows)
        row_count = len(df)
        summary_metrics["rowCount"] = row_count

        # 2. Null Value & Missing Data Analysis
        for col in df.columns:
            null_count = int(df[col].isnull().sum())
            if null_count > 0:
                pct = round((null_count / row_count) * 100, 1)
                warnings.append(ResultValidationWarning(
                    code="NULL_VALUES_DETECTED",
                    severity="warning" if pct < 30 else "critical",
                    column=col,
                    message=f"Column '{col}' contains {null_count} null/missing values ({pct}% of result set).",
                    suggestion="Consider filtering out null records or utilizing COALESCE."
                ))

        # 3. Non-Finite Numerical Check (NaN, Infinity)
        numeric_cols = df.select_dtypes(include=["number"]).columns
        for col in numeric_cols:
            inf_count = int(df[col].isin([float('inf'), float('-inf')]).sum())
            if inf_count > 0:
                warnings.append(ResultValidationWarning(
                    code="INFINITE_VALUE_DETECTED",
                    severity="critical",
                    column=col,
                    message=f"Column '{col}' contains {inf_count} infinite values, indicative of division by zero.",
                    suggestion="Add a condition to guard against zero or missing denominators."
                ))

        # 4. Temporal Comparison Period Validation
        # Check if query was intended to compare two periods
        has_abs_change = "absolute_change" in df.columns
        has_pct_change = "relative_pct_change" in df.columns

        if has_abs_change or has_pct_change:
            has_comparison = True
            comp_details["hasAbsoluteChange"] = has_abs_change
            comp_details["hasRelativePctChange"] = has_pct_change

            # Verify that base values existed
            val_cols = [c for c in df.columns if c.startswith("value_")]
            comp_details["comparisonPeriodColumns"] = val_cols

            if len(val_cols) < 2 and not ("val_prev" in df.columns and "val_curr" in df.columns):
                warnings.append(ResultValidationWarning(
                    code="INCOMPLETE_COMPARISON_PERIODS",
                    severity="critical",
                    message="Change over time was requested, but fewer than two comparison periods were returned.",
                    suggestion="Verify that both start and end reporting periods are selected in the query."
                ))

            # Inspect zero denominators in relative percentage change
            if has_pct_change:
                null_pct_count = int(df["relative_pct_change"].isnull().sum())
                if null_pct_count > 0:
                    warnings.append(ResultValidationWarning(
                        code="ZERO_DENOMINATOR_HANDLED",
                        severity="info",
                        column="relative_pct_change",
                        message=f"{null_pct_count} row(s) had a baseline value of zero or null; relative percentage change was set to NULL rather than an arbitrary figure.",
                        suggestion="Inspect absolute point changes for these specific entities."
                    ))

        elif expected_analysis_type == "trend_change":
            warnings.append(ResultValidationWarning(
                code="MISSING_CHANGE_COMPUTATION",
                severity="warning",
                message="Question requested a trend or change over time, but the query did not compute a difference metric.",
                suggestion="Compute absolute difference (current - previous) across periods."
            ))

        # 5. Summary Numerical Computations
        for col in numeric_cols:
            clean_series = df[col].dropna()
            if not clean_series.empty:
                summary_metrics[f"{col}_min"] = float(clean_series.min())
                summary_metrics[f"{col}_max"] = float(clean_series.max())
                summary_metrics[f"{col}_avg"] = round(float(clean_series.mean()), 2)

        return ResultValidationResult(
            is_valid=len([w for w in warnings if w.severity == "critical"]) == 0,
            warnings=warnings,
            summary_metrics=summary_metrics,
            has_comparison_periods=has_comparison,
            comparison_details=comp_details if has_comparison else None
        )

result_validator = ResultValidator()
