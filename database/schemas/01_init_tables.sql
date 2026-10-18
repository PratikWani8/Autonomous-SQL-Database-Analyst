-- ==============================================================================
-- DATABASE SCHEMA DEFINITION: INDIAN PUBLIC DATASETS
-- ==============================================================================

-- 1. District Unemployment & Labour Force Statistics (PLFS / data.gov.in)
CREATE TABLE IF NOT EXISTS district_unemployment_stats (
    id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    reporting_year VARCHAR(20) NOT NULL,
    rural_unemployment_rate NUMERIC(5,2),
    urban_unemployment_rate NUMERIC(5,2),
    overall_unemployment_rate NUMERIC(5,2) NOT NULL,
    labour_force_participation_rate NUMERIC(5,2),
    worker_population_ratio NUMERIC(5,2),
    surveyed_households INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_plfs_unemployment_positive CHECK (overall_unemployment_rate >= 0 AND overall_unemployment_rate <= 100),
    CONSTRAINT uq_district_year UNIQUE (district_name, state_name, reporting_year)
);

CREATE INDEX IF NOT EXISTS idx_plfs_state ON district_unemployment_stats(state_name);
CREATE INDEX IF NOT EXISTS idx_plfs_district ON district_unemployment_stats(district_name);
CREATE INDEX IF NOT EXISTS idx_plfs_year ON district_unemployment_stats(reporting_year);
CREATE INDEX IF NOT EXISTS idx_plfs_state_year ON district_unemployment_stats(state_name, reporting_year);

-- 2. District Demographic & Literacy Statistics (Census of India)
CREATE TABLE IF NOT EXISTS district_demographics_stats (
    id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    census_year INTEGER NOT NULL,
    total_population BIGINT NOT NULL,
    male_population BIGINT NOT NULL,
    female_population BIGINT NOT NULL,
    sex_ratio INTEGER NOT NULL,
    literacy_rate NUMERIC(5,2) NOT NULL,
    male_literacy_rate NUMERIC(5,2),
    female_literacy_rate NUMERIC(5,2),
    area_sq_km NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_census_year CHECK (census_year IN (2001, 2011)),
    CONSTRAINT uq_census_district_year UNIQUE (district_name, state_name, census_year)
);

CREATE INDEX IF NOT EXISTS idx_census_state ON district_demographics_stats(state_name);
CREATE INDEX IF NOT EXISTS idx_census_district ON district_demographics_stats(district_name);
CREATE INDEX IF NOT EXISTS idx_census_year ON district_demographics_stats(census_year);
CREATE INDEX IF NOT EXISTS idx_census_population ON district_demographics_stats(total_population);

-- 3. NFHS-5 District Health & Welfare Indicators
CREATE TABLE IF NOT EXISTS district_health_indicators (
    id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    survey_period VARCHAR(20) NOT NULL DEFAULT '2019-21',
    institutional_births_pct NUMERIC(5,2),
    children_fully_immunized_pct NUMERIC(5,2),
    women_literacy_pct NUMERIC(5,2),
    clean_cooking_fuel_pct NUMERIC(5,2),
    improved_sanitation_pct NUMERIC(5,2),
    sex_ratio_at_birth INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_nfhs_district UNIQUE (district_name, state_name, survey_period)
);

CREATE INDEX IF NOT EXISTS idx_nfhs_state ON district_health_indicators(state_name);
CREATE INDEX IF NOT EXISTS idx_nfhs_district ON district_health_indicators(district_name);
