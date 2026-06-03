# ============================================================
# database.py — Conexión a PostgreSQL con SQLAlchemy
# get_db() es una dependencia que FastAPI inyecta en cada
# endpoint que necesite hablar con la base de datos.
# ============================================================
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import get_settings

settings = get_settings()

# El engine es la conexión real a PostgreSQL
engine = create_engine(settings.DATABASE_URL)

# SessionLocal es la "fábrica" de sesiones de base de datos
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# Base de la que heredan todos los modelos SQLAlchemy
class Base(DeclarativeBase):
    pass


# Dependencia de FastAPI: abre sesión → ejecuta endpoint → cierra sesión
def get_db():
    db = SessionLocal()
    try:
        yield db          # FastAPI usa el valor hasta aquí
    finally:
        db.close()        # siempre cierra aunque haya error
