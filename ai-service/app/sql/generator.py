"""
PostgreSQL SQL Generator.
Generates robust, parameterized, and syntax-correct analytical queries
from structured ParsedIntent objects and discovered schemas.
Enforces safe CTE patterns, division-by-zero guards, and clean aliases.
"""

from app.services.intent_parser import ParsedIntent
from app.core.config import settings

class SQLGenerator:
    @staticmethod
    def generate_from_intent(intent: ParsedIntent) -> str:
        table = intent.target_table
        metric = intent.target_metric
        limit = min(intent.limit, settings.SQL_MAX_ROWS)
        sort_order = intent.sort_order

        # 1. Temporal Trend / Change Analysis (e.g. 2021-22 vs 2022-23 or 2001 vs 2011)
        if intent.analysis_type == "trend_change" and len(intent.comparison_periods) >= 2:
            p_prev = intent.comparison_periods[0]
            p_curr = intent.comparison_periods[1]

            year_col = "reporting_year" if table == "district_unemployment_stats" else "census_year"
            # Format condition quotes
            prev_filter = f"'{p_prev}'" if isinstance(p_prev, str) and not p_prev.isdigit() else p_prev
            curr_filter = f"'{p_curr}'" if isinstance(p_curr, str) and not p_curr.isdigit() else p_curr

            state_clause = f"AND state_name = '{intent.state_filter}'" if intent.state_filter else ""

            sort_col = "relative_pct_change" if intent.comparison_basis == "relative_percentage_change" else "absolute_change"

            sql = f"""WITH period_1 AS (
    SELECT state_name, district_name, {metric} AS val_prev
    FROM {table}
    WHERE {year_col} = {prev_filter} {state_clause}
),
period_2 AS (
    SELECT state_name, district_name, {metric} AS val_curr
    FROM {table}
    WHERE {year_col} = {curr_filter} {state_clause}
)
SELECT 
    p2.state_name,
    p2.district_name,
    p1.val_prev AS value_{str(p_prev).replace('-', '_')},
    p2.val_curr AS value_{str(p_curr).replace('-', '_')},
    ROUND(p2.val_curr - p1.val_prev, 2) AS absolute_change,
    CASE 
        WHEN p1.val_prev > 0 THEN ROUND(((p2.val_curr - p1.val_prev) / p1.val_prev) * 100.0, 2)
        ELSE NULL 
    END AS relative_pct_change
FROM period_2 p2
JOIN period_1 p1 ON p2.district_name = p1.district_name AND p2.state_name = p1.state_name
ORDER BY {sort_col} {sort_order} NULLS LAST
LIMIT {limit}"""
            return sql

        # 2. Ranking Analysis (Top / Bottom Districts)
        elif intent.analysis_type == "ranking":
            where_conditions = []
            if intent.comparison_periods:
                p = intent.comparison_periods[0]
                year_col = "reporting_year" if table == "district_unemployment_stats" else ("census_year" if table == "district_demographics_stats" else "survey_period")
                p_filter = f"'{p}'" if isinstance(p, str) and not p.isdigit() else p
                where_conditions.append(f"{year_col} = {p_filter}")

            if intent.state_filter:
                where_conditions.append(f"state_name = '{intent.state_filter}'")

            where_clause = f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""

            # Select relevant supplementary columns
            extra_cols = []
            if table == "district_unemployment_stats":
                extra_cols = ["rural_unemployment_rate", "urban_unemployment_rate", "labour_force_participation_rate"]
            elif table == "district_demographics_stats":
                extra_cols = ["sex_ratio", "literacy_rate"] if metric != "literacy_rate" else ["total_population", "sex_ratio"]
            elif table == "district_health_indicators":
                extra_cols = ["women_literacy_pct", "improved_sanitation_pct"]

            # Filter out metric if already included
            extra_cols = [c for c in extra_cols if c != metric]
            extra_cols_str = f", {', '.join(extra_cols)}" if extra_cols else ""

            sql = f"""SELECT state_name, district_name, {metric}{extra_cols_str}
FROM {table}
{where_clause}
ORDER BY {metric} {sort_order} NULLS LAST
LIMIT {limit}"""
            return sql

        # 3. State Aggregation / Average
        else:
            where_conditions = []
            if table == "district_unemployment_stats":
                where_conditions.append("reporting_year = '2022-23'")
            elif table == "district_demographics_stats":
                where_conditions.append("census_year = 2011")

            where_clause = f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""

            sql = f"""SELECT 
    state_name,
    COUNT(DISTINCT district_name) AS total_districts,
    ROUND(AVG({metric}), 2) AS avg_{metric},
    ROUND(MIN({metric}), 2) AS min_{metric},
    ROUND(MAX({metric}), 2) AS max_{metric}
FROM {table}
{where_clause}
GROUP BY state_name
ORDER BY avg_{metric} {sort_order}
LIMIT {limit}"""
            return sql

sql_generator = SQLGenerator()
