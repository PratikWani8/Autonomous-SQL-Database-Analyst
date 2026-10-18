"""
Unit Tests for SQLGlot-based SQL Validator.
Tests single-statement enforcement, DDL/DML rejection, CTE safety, and table allowlisting.
"""

import pytest
from app.sql.validator import SQLValidator

@pytest.fixture
def validator():
    return SQLValidator(
        allowed_tables=["district_unemployment_stats", "district_demographics_stats", "district_health_indicators"],
        max_rows=500
    )

def test_valid_select_query(validator):
    sql = "SELECT district_name, overall_unemployment_rate FROM district_unemployment_stats WHERE reporting_year = '2022-23' ORDER BY overall_unemployment_rate DESC LIMIT 5;"
    res = validator.validate(sql)
    assert res.is_valid is True
    assert res.risk_level == "safe"
    assert "district_unemployment_stats" in res.tables_accessed
    assert res.row_limit_applied == 5

def test_automatic_limit_injection(validator):
    sql = "SELECT district_name FROM district_demographics_stats;"
    res = validator.validate(sql)
    assert res.is_valid is True
    assert res.has_limit is True
    assert res.row_limit_applied == 500
    assert "LIMIT 500" in res.parsed_sql

def test_reject_insert(validator):
    sql = "INSERT INTO district_unemployment_stats (state_name, district_name, reporting_year, overall_unemployment_rate) VALUES ('Goa', 'North Goa', '2023', 5.0);"
    res = validator.validate(sql)
    assert res.is_valid is False
    assert res.risk_level == "blocked"
    assert any("Data-modifying" in v or "Insert" in v for v in res.violations)

def test_reject_drop_table(validator):
    sql = "DROP TABLE district_unemployment_stats;"
    res = validator.validate(sql)
    assert res.is_valid is False
    assert res.risk_level == "blocked"

def test_reject_alter_table(validator):
    sql = "ALTER TABLE district_demographics_stats ADD COLUMN malicious_col VARCHAR;"
    res = validator.validate(sql)
    assert res.is_valid is False

def test_reject_update(validator):
    sql = "UPDATE district_unemployment_stats SET overall_unemployment_rate = 0 WHERE district_name = 'Mumbai';"
    res = validator.validate(sql)
    assert res.is_valid is False

def test_reject_delete(validator):
    sql = "DELETE FROM district_health_indicators WHERE id = 1;"
    res = validator.validate(sql)
    assert res.is_valid is False

def test_reject_multiple_statements(validator):
    sql = "SELECT district_name FROM district_demographics_stats; DROP TABLE district_health_indicators;"
    res = validator.validate(sql)
    assert res.is_valid is False
    assert any("Multiple SQL statements" in v for v in res.violations)

def test_reject_select_into(validator):
    sql = "SELECT * INTO backup_table FROM district_demographics_stats;"
    res = validator.validate(sql)
    assert res.is_valid is False

def test_reject_system_catalog_access(validator):
    sql = "SELECT * FROM pg_catalog.pg_roles;"
    res = validator.validate(sql)
    assert res.is_valid is False
    assert any("pg_catalog" in v or "pg_roles" in v for v in res.violations)

def test_reject_unauthorized_table(validator):
    sql = "SELECT * FROM secret_payroll_data;"
    res = validator.validate(sql)
    assert res.is_valid is False
    assert any("unauthorized table" in v for v in res.violations)

def test_reject_dangerous_functions(validator):
    sql = "SELECT pg_read_file('/etc/passwd');"
    res = validator.validate(sql)
    assert res.is_valid is False
    assert any("Dangerous" in v or "pg_read_file" in v for v in res.violations)

def test_valid_read_only_cte(validator):
    sql = """
    WITH p1 AS (
        SELECT district_name, overall_unemployment_rate FROM district_unemployment_stats WHERE reporting_year = '2021-22'
    ),
    p2 AS (
        SELECT district_name, overall_unemployment_rate FROM district_unemployment_stats WHERE reporting_year = '2022-23'
    )
    SELECT p2.district_name, (p2.overall_unemployment_rate - p1.overall_unemployment_rate) AS diff
    FROM p2 JOIN p1 ON p2.district_name = p1.district_name
    ORDER BY diff DESC LIMIT 5;
    """
    res = validator.validate(sql)
    assert res.is_valid is True
    assert res.risk_level == "safe"
