-- ==============================================================================
-- DEDICATED READ-ONLY POSTGRESQL USER SETUP SCRIPT
-- ==============================================================================
-- Security Control: The AI service connects ONLY via this restricted role.
-- It has NO write capabilities, cannot execute DDL/DML, and cannot touch system catalogs.

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'analyst_readonly') THEN
        CREATE ROLE analyst_readonly WITH LOGIN PASSWORD 'readonly_secure_pass123' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
    ELSE
        ALTER ROLE analyst_readonly WITH PASSWORD 'readonly_secure_pass123';
    END IF;
END
$$;

-- Connect and configure permissions on target database
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM analyst_readonly;

-- Grant schema usage and SELECT on tables
GRANT USAGE ON SCHEMA public TO analyst_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analyst_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO analyst_readonly;

-- Ensure future tables inherit SELECT permission only
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analyst_readonly;

-- Safety defaults enforced directly in the database role
ALTER ROLE analyst_readonly SET default_transaction_read_only = on;
ALTER ROLE analyst_readonly SET statement_timeout = '5000ms';
ALTER ROLE analyst_readonly SET lock_timeout = '3000ms';
ALTER ROLE analyst_readonly SET idle_in_transaction_session_timeout = '5000ms';
