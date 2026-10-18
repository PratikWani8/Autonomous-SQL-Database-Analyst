"""
Configuration management for AI Service using Pydantic Settings.
"""

from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Service Configuration
    AI_SERVICE_HOST: str = "0.0.0.0"
    AI_SERVICE_PORT: int = 8000
    INTERNAL_SERVICE_KEY: str = "internal_service_secret_token_12345"

    # Dedicated READ-ONLY PostgreSQL Connection
    DATABASE_URL: str = "postgresql://analyst_readonly:readonly_secure_pass123@localhost:5432/indian_public_data"
    
    # LLM Settings
    LLM_PROVIDER: str = "deterministic"  # 'deterministic', 'gemini', 'openai', 'groq', 'ollama'
    LLM_MODEL: str = "gemini-1.5-pro"
    LLM_API_KEY: Optional[str] = None
    LLM_TIMEOUT_SECONDS: int = 30

    # Query Execution & Safety Constraints
    SQL_STATEMENT_TIMEOUT_MS: int = 5000
    SQL_MAX_ROWS: int = 500
    MAX_CORRECTION_ATTEMPTS: int = 2

    # Allowlist of accessible tables
    ALLOWED_TABLES: list[str] = [
        "district_unemployment_stats",
        "district_demographics_stats",
        "district_health_indicators"
    ]

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
