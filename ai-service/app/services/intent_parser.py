"""
Intent Analysis & Semantic Parser.
Deconstructs natural-language questions into structured analytical parameters:
metrics, dimensions, temporal comparison types (absolute vs relative change),
filtering criteria, sorting, and ambiguity detection.
Supports English, Hindi, and Marathi inputs.
"""

import re
from typing import Optional, Literal
from pydantic import BaseModel, Field

class ParsedIntent(BaseModel):
    original_question: str
    target_table: str
    target_metric: str
    analysis_type: Literal["ranking", "trend_change", "aggregation", "filter_lookup", "comparison", "unknown"]
    comparison_periods: list[str] = Field(default_factory=list)
    comparison_basis: Literal["absolute_change", "relative_percentage_change", "none"] = "none"
    dimensions: list[str] = Field(default_factory=list)
    state_filter: Optional[str] = None
    limit: int = 10
    sort_order: Literal["ASC", "DESC"] = "DESC"
    is_ambiguous: bool = False
    ambiguity_reason: Optional[str] = None
    interpreted_summary: str

INDIAN_STATES = [
    "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh", "Gujarat",
    "Kerala", "Rajasthan", "Bihar", "Madhya Pradesh", "West Bengal",
    "Odisha", "Punjab", "Haryana", "Andhra Pradesh", "Telangana"
]

class IntentParser:
    @staticmethod
    def parse(question: str, preselected_table: Optional[str] = None) -> ParsedIntent:
        q_lower = question.lower().strip()

        # 1. Detect State Filters
        detected_state = None
        for state in INDIAN_STATES:
            if re.search(r'\b' + re.escape(state.lower()) + r'\b', q_lower):
                detected_state = state
                break

        # 2. Detect Target Table & Domain
        target_table = preselected_table
        if not target_table:
            if any(k in q_lower for k in ["unemployment", "jobless", "berojgari", "रोजगार", "बेरोजगारी", "labour", "wpr", "lfpr"]):
                target_table = "district_unemployment_stats"
            elif any(k in q_lower for k in ["population", "census", "sex ratio", "literacy", "जनसंख्या", "साक्षरता", "लिंग अनुपात"]):
                target_table = "district_demographics_stats"
            elif any(k in q_lower for k in ["health", "nfhs", "birth", "immunization", "sanitation", "cooking fuel", "स्वास्थ्य", "टीकाकरण"]):
                target_table = "district_health_indicators"
            else:
                target_table = "district_unemployment_stats"  # Default primary demo dataset

        # 3. Detect Analysis Type & Temporal Trend
        is_change_query = any(k in q_lower for k in [
            "increase", "decrease", "change", "growth", "rise", "fallen", "largest increase",
            "highest increase", "बदलाव", "वृद्धि", "वाढ"
        ])

        is_ranking = any(k in q_lower for k in [
            "which five", "top 5", "top 10", "highest", "lowest", "five districts",
            "शीर्ष", "सबसे अधिक", "सर्वाधिक"
        ])

        # Detect Limit count
        limit = 10
        limit_match = re.search(r'\b(?:top|first|which)\s+(\d+)\b', q_lower)
        if limit_match:
            limit = int(limit_match.group(1))
        elif "five" in q_lower or "5" in q_lower:
            limit = 5

        # Sort order (highest vs lowest)
        sort_order = "ASC" if any(k in q_lower for k in ["lowest", "least", "bottom", "कम", "सर्वात कमी"]) else "DESC"

        # 4. Target Metric & Calculation Basis
        target_metric = ""
        comparison_basis = "none"
        comparison_periods = []

        if target_table == "district_unemployment_stats":
            if "rural" in q_lower:
                target_metric = "rural_unemployment_rate"
            elif "urban" in q_lower:
                target_metric = "urban_unemployment_rate"
            elif "labour force" in q_lower or "lfpr" in q_lower:
                target_metric = "labour_force_participation_rate"
            elif "worker" in q_lower or "wpr" in q_lower:
                target_metric = "worker_population_ratio"
            else:
                target_metric = "overall_unemployment_rate"

            if is_change_query:
                analysis_type = "trend_change"
                comparison_periods = ["2021-22", "2022-23"]
                comparison_basis = "relative_percentage_change" if "percentage" in q_lower or "%" in q_lower else "absolute_change"
            elif is_ranking:
                analysis_type = "ranking"
                comparison_periods = ["2022-23"]
            else:
                analysis_type = "aggregation"

        elif target_table == "district_demographics_stats":
            if "literacy" in q_lower:
                target_metric = "literacy_rate"
            elif "sex ratio" in q_lower:
                target_metric = "sex_ratio"
            elif "female population" in q_lower:
                target_metric = "female_population"
            else:
                target_metric = "total_population"

            if is_change_query:
                analysis_type = "trend_change"
                comparison_periods = ["2001", "2011"]
                comparison_basis = "absolute_change"
            elif is_ranking:
                analysis_type = "ranking"
                comparison_periods = ["2011"]
            else:
                analysis_type = "aggregation"

        else:  # district_health_indicators
            if "immunization" in q_lower:
                target_metric = "children_fully_immunized_pct"
            elif "sanitation" in q_lower:
                target_metric = "improved_sanitation_pct"
            elif "clean fuel" in q_lower or "cooking fuel" in q_lower:
                target_metric = "clean_cooking_fuel_pct"
            elif "women literacy" in q_lower:
                target_metric = "women_literacy_pct"
            elif "sex ratio" in q_lower:
                target_metric = "sex_ratio_at_birth"
            else:
                target_metric = "institutional_births_pct"

            comparison_periods = ["2019-21"]
            analysis_type = "ranking" if is_ranking else "aggregation"

        # 5. Format Interpreted Summary
        if analysis_type == "trend_change":
            basis_str = "relative percentage change" if comparison_basis == "relative_percentage_change" else "absolute point difference"
            interpreted_summary = f"Calculation of {basis_str} in '{target_metric}' across periods ({', '.join(comparison_periods)}) for districts"
            if detected_state:
                interpreted_summary += f" in {detected_state}"
            interpreted_summary += f", sorted {sort_order} (limit {limit})."
        elif analysis_type == "ranking":
            period_str = f" for period {comparison_periods[0]}" if comparison_periods else ""
            interpreted_summary = f"Ranking districts by '{target_metric}'{period_str}"
            if detected_state:
                interpreted_summary += f" in {detected_state}"
            interpreted_summary += f", sorted {sort_order} (limit {limit})."
        else:
            interpreted_summary = f"Aggregated analysis of '{target_metric}' on table '{target_table}'."

        return ParsedIntent(
            original_question=question,
            target_table=target_table,
            target_metric=target_metric,
            analysis_type=analysis_type,
            comparison_periods=comparison_periods,
            comparison_basis=comparison_basis,
            dimensions=["district_name", "state_name"],
            state_filter=detected_state,
            limit=limit,
            sort_order=sort_order,
            interpreted_summary=interpreted_summary
        )

intent_parser = IntentParser()
