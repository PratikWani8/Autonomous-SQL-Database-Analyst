# Indian Public Datasets - Provenance and Metadata

This repository integrates genuine, structured Indian public datasets sourced from official government publications and data portals. All datasets comply with the **Open Government Data License - India (OGDL-India)**.

## 1. Selected Datasets Overview

| Dataset ID | Table Name | Title | Official Source | License | Reporting Periods |
|---|---|---|---|---|---|
| `plfs_unemployment` | `district_unemployment_stats` | District-wise Estimates of Labour Force Participation & Unemployment Rates | Ministry of Statistics and Programme Implementation (MoSPI) / data.gov.in | OGDL-India | 2021-22, 2022-23 |
| `census_demographics` | `district_demographics_stats` | District Population, Sex Ratio, and Literacy Statistics | Office of the Registrar General & Census Commissioner / data.gov.in | OGDL-India | 2001, 2011 |
| `nfhs5_health` | `district_health_indicators` | National Family Health Survey (NFHS-5) District Indicators | Ministry of Health and Family Welfare (MoHFW) / IIPS | OGDL-India | 2019-21 |

---

## 2. Dataset 1: District Unemployment & Labour Force Statistics (`district_unemployment_stats`)
- **Source Portal:** Open Government Data (OGD) Platform India (https://data.gov.in)
- **Publishing Authority:** National Statistical Office (NSO), MoSPI, Government of India
- **Publication:** Periodic Labour Force Survey (PLFS) & Annual District Statistics
- **License:** Open Government Data License - India (OGDL-India)
- **Granularity:** District-level across major Indian states
- **Reporting Periods:** `2021-22` and `2022-23`
- **Fields:**
  - `state_name` (VARCHAR): Name of the Indian State/UT (e.g., Maharashtra, Karnataka, Uttar Pradesh).
  - `district_name` (VARCHAR): Name of the administrative district.
  - `reporting_year` (VARCHAR): Financial/Survey Year (`2021-22` or `2022-23`).
  - `rural_unemployment_rate` (NUMERIC): Unemployment rate in rural areas (%).
  - `urban_unemployment_rate` (NUMERIC): Unemployment rate in urban areas (%).
  - `overall_unemployment_rate` (NUMERIC): Combined district unemployment rate (%).
  - `labour_force_participation_rate` (NUMERIC): Labour Force Participation Rate (LFPR) in %.
  - `worker_population_ratio` (NUMERIC): Worker Population Ratio (WPR) in %.
  - `surveyed_households` (INTEGER): Number of surveyed households in sample.

---

## 3. Dataset 2: District Demographics & Literacy (`district_demographics_stats`)
- **Source Portal:** Census Digital Library & data.gov.in (https://censusindia.gov.in)
- **Publishing Authority:** Registrar General & Census Commissioner of India, Ministry of Home Affairs
- **Publication:** Primary Census Abstracts (PCA) 2001 & 2011
- **License:** OGDL-India
- **Fields:**
  - `state_name` (VARCHAR): Name of the Indian State.
  - `district_name` (VARCHAR): Administrative district.
  - `census_year` (INTEGER): Census enumeration year (`2001` or `2011`).
  - `total_population` (BIGINT): Total enumerated population.
  - `male_population` (BIGINT): Male population.
  - `female_population` (BIGINT): Female population.
  - `sex_ratio` (INTEGER): Number of females per 1,000 males.
  - `literacy_rate` (NUMERIC): Overall literacy percentage.
  - `male_literacy_rate` (NUMERIC): Male literacy percentage.
  - `female_literacy_rate` (NUMERIC): Female literacy percentage.
  - `area_sq_km` (NUMERIC): Geographic area in square kilometers.

---

## 4. Dataset 3: NFHS-5 District Health Indicators (`district_health_indicators`)
- **Source Portal:** International Institute for Population Sciences & MoHFW (http://rchiips.org/nfhs)
- **Publishing Authority:** Ministry of Health and Family Welfare, Government of India
- **Publication:** National Family Health Survey (NFHS-5, 2019-21) Factsheets
- **License:** OGDL-India
- **Fields:**
  - `state_name` (VARCHAR): Name of the State.
  - `district_name` (VARCHAR): Name of the District.
  - `survey_period` (VARCHAR): Survey cycle (`2019-21`).
  - `institutional_births_pct` (NUMERIC): Institutional births (%).
  - `children_fully_immunized_pct` (NUMERIC): Children age 12-23 months fully immunized (%).
  - `women_literacy_pct` (NUMERIC): Literate women aged 15-49 (%).
  - `clean_cooking_fuel_pct` (NUMERIC): Households using clean fuel for cooking (%).
  - `improved_sanitation_pct` (NUMERIC): Households with improved sanitation facility (%).
  - `sex_ratio_at_birth` (INTEGER): Sex ratio at birth for children born in the last 5 years.

---

## 5. Ingestion & Quality Control Principles
1. **No Synthetic Falsification:** All records follow genuine Indian geographic entities and official statistical parameters.
2. **Explicit Provenance:** Every table retains metadata regarding download timestamps, source versions, and licenses.
3. **Multi-Period Temporal Analysis:** Datasets feature distinct reporting periods (`2021-22` vs `2022-23` and `2001` vs `2011`), enabling rigorous trend and change queries (absolute differences and percentage differences).
