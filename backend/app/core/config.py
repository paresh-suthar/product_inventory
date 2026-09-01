import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = 'StockFlow Server & Financial ERP'
    VERSION: str = '1.0.0'
    API_V1_STR: str = '/api/v1'
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'stockflow-super-secret-jwt-key-2026-secure-token')
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database: Supports Postgres asyncpg with SQLite fallback
    DATABASE_URL: str = os.getenv(
        'DATABASE_URL',
        'sqlite+aiosqlite:///./stockflow.db'
    )
    
    BASE_CURRENCY: str = 'USD'

    class Config:
        case_sensitive = True

settings = Settings()
