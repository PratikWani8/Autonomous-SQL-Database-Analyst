# Automated Dataset Ingestion & Quality Control Report

*Generated at: 2026-10-17T04:19:20.450173+00:00*

## Ingestion Summary

| Table Name | Title | Source Version | Inserted Rows | Duplicates | Missing Values |
|---|---|---|---|---|---|
| `district_demographics_stats` | District Population, Sex Ratio, and Literacy Statistics | OGDL-India | 300 | 0 | 0 |
| `district_health_indicators` | National Family Health Survey (NFHS-5) District Indicators | OGDL-India | 150 | 0 | 0 |
| `district_unemployment_stats` | District-wise Labour Force Participation and Unemployment Rates | OGDL-India | 300 | 0 | 0 |

## Detailed Quality Metrics

### District Population, Sex Ratio, and Literacy Statistics (`district_demographics_stats`)
- **Source URL:** https://censusindia.gov.in/census.website/data/census-tables
- **License:** Open Government Data License - India (OGDL-India)
- **Available Reporting Periods:** 2001, 2011
- **Total Rows Ingested:** 300
- **Validation Failures / Rejected Rows:** 0
- **Field Quality Analysis:**
  - `state_name`: 0 nulls (0.0%)
  - `district_name`: 0 nulls (0.0%)
  - `census_year`: 0 nulls (0.0%)
  - `total_population`: 0 nulls (0.0%)
  - `male_population`: 0 nulls (0.0%)
  - `female_population`: 0 nulls (0.0%)
  - `sex_ratio`: 0 nulls (0.0%)
  - `literacy_rate`: 0 nulls (0.0%)
  - `male_literacy_rate`: 0 nulls (0.0%)
  - `female_literacy_rate`: 0 nulls (0.0%)
  - `area_sq_km`: 0 nulls (0.0%)

### National Family Health Survey (NFHS-5) District Indicators (`district_health_indicators`)
- **Source URL:** http://rchiips.org/nfhs/factsheet_NFHS-5.shtml
- **License:** Open Government Data License - India (OGDL-India)
- **Available Reporting Periods:** 2019-21
- **Total Rows Ingested:** 150
- **Validation Failures / Rejected Rows:** 0
- **Field Quality Analysis:**
  - `state_name`: 0 nulls (0.0%)
  - `district_name`: 0 nulls (0.0%)
  - `survey_period`: 0 nulls (0.0%)
  - `institutional_births_pct`: 0 nulls (0.0%)
  - `children_fully_immunized_pct`: 0 nulls (0.0%)
  - `women_literacy_pct`: 0 nulls (0.0%)
  - `clean_cooking_fuel_pct`: 0 nulls (0.0%)
  - `improved_sanitation_pct`: 0 nulls (0.0%)
  - `sex_ratio_at_birth`: 0 nulls (0.0%)

### District-wise Labour Force Participation and Unemployment Rates (`district_unemployment_stats`)
- **Source URL:** https://data.gov.in/resource/periodic-labour-force-survey-district-estimates
- **License:** Open Government Data License - India (OGDL-India)
- **Available Reporting Periods:** 2021-22, 2022-23
- **Total Rows Ingested:** 300
- **Validation Failures / Rejected Rows:** 0
- **Field Quality Analysis:**
  - `state_name`: 0 nulls (0.0%)
  - `district_name`: 0 nulls (0.0%)
  - `reporting_year`: 0 nulls (0.0%)
  - `rural_unemployment_rate`: 0 nulls (0.0%)
  - `urban_unemployment_rate`: 0 nulls (0.0%)
  - `overall_unemployment_rate`: 0 nulls (0.0%)
  - `labour_force_participation_rate`: 0 nulls (0.0%)
  - `worker_population_ratio`: 0 nulls (0.0%)
  - `surveyed_households`: 0 nulls (0.0%)

