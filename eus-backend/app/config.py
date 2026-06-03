# ============================================================
# config.py — Lee las variables del archivo .env
# Pydantic-settings valida que todas existan al arrancar.
# Si falta alguna, el servidor lanza un error claro.
# ============================================================
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"


# lru_cache evita leer el archivo .env en cada petición
@lru_cache
def get_settings() -> Settings:
    return Settings()
