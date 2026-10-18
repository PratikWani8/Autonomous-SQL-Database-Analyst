"""
Visualization Specification Recommender.
Maps returned columns and statistical shapes into trusted, validated Recharts configurations.
"""

from typing import Any, Optional
from app.schemas.models import ChartSpecification

class VisualizationSpecGenerator:
    @staticmethod
    def generate_spec(
        rows: list[dict[str, Any]],
        question: str,
        analysis_type: str = "ranking",
        target_metric: Optional[str] = None
    ) -> Optional[ChartSpecification]:
        if not rows:
            return None

        first_row = rows[0]
        row_count = len(rows)

        # 1. KPI Card for Single Value Results
        if row_count == 1:
            numeric_cols = [c for c, v in first_row.items() if isinstance(v, (int, float))]
            if numeric_cols:
                y_key = numeric_cols[0]
                return ChartSpecification(
                    type="kpi",
                    title=question,
                    xKey="dimension",
                    yKey=y_key,
                    unit="",
                    recommendation_reason="Single aggregated scalar result rendered as a KPI card."
                )

        # 2. Bar Chart for Temporal Changes / Top District Rankings
        if "absolute_change" in first_row:
            x_key = "district_name" if "district_name" in first_row else "state_name"
            return ChartSpecification(
                type="bar",
                title="Largest District-Level Indicator Changes",
                xKey=x_key,
                yKey="absolute_change",
                xLabel="District",
                yLabel="Change (Current - Previous)",
                unit="percentage points",
                series=["absolute_change"],
                recommendation_reason="Ranked bar chart effectively highlights comparative district gains/losses."
            )

        if "relative_pct_change" in first_row:
            x_key = "district_name" if "district_name" in first_row else "state_name"
            return ChartSpecification(
                type="bar",
                title="Relative Percentage Growth by District",
                xKey=x_key,
                yKey="relative_pct_change",
                xLabel="District",
                yLabel="Relative Change (%)",
                unit="%",
                series=["relative_pct_change"],
                recommendation_reason="Bar chart illustrates proportional relative growth across districts."
            )

        # 3. Categorical Ranking Bar Chart (e.g. Top 5 / Top 10)
        x_key = "district_name" if "district_name" in first_row else ("state_name" if "state_name" in first_row else list(first_row.keys())[0])

        numeric_cols = [
            c for c, v in first_row.items()
            if isinstance(v, (int, float)) and c not in ["id", "census_year"]
        ]

        if numeric_cols:
            primary_metric = target_metric if target_metric in numeric_cols else numeric_cols[0]
            metric_label = primary_metric.replace("_", " ").title()

            unit = "%" if any(u in primary_metric for u in ["rate", "pct", "ratio"]) else "Count"

            # Use Line chart if multiple time points exist or Area chart for cumulative
            if any(t in question.lower() for t in ["trend", "over time", "history"]):
                chart_type = "line"
            elif row_count <= 8 and any(p in question.lower() for p in ["share", "distribution", "percentage of total"]):
                chart_type = "pie"
            else:
                chart_type = "bar"

            return ChartSpecification(
                type=chart_type,
                title=f"{metric_label} Comparison across {x_key.replace('_', ' ').title()}s",
                xKey=x_key,
                yKey=primary_metric,
                xLabel=x_key.replace("_", " ").title(),
                yLabel=metric_label,
                unit=unit,
                series=[primary_metric],
                recommendation_reason=f"Recommended {chart_type} chart for clear comparative visualization of {metric_label}."
            )

        # Fallback to Table view
        return ChartSpecification(
            type="table",
            title="Tabular Data Records",
            recommendation_reason="Data shape is best inspected in a tabular view."
        )

vis_spec_generator = VisualizationSpecGenerator()
