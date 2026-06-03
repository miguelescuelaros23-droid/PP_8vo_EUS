# ============================================================
# auxiliares.py — modelos SQLAlchemy para tablas secundarias
# Importar desde aquí en cualquier router que los necesite.
# ============================================================
from sqlalchemy import Column, String, Boolean, Date
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from app.database import Base


class Personal(Base):
    __tablename__ = "personal"
    id              = Column(PGUUID(as_uuid=True), primary_key=True)
    nombre_completo = Column(String)
    tipo            = Column(String)
    institucion_id  = Column(PGUUID(as_uuid=True))
    activo          = Column(Boolean)


class Institucion(Base):
    __tablename__ = "instituciones"
    id     = Column(PGUUID(as_uuid=True), primary_key=True)
    nombre = Column(String)
    sector = Column(String)
    tipo   = Column(String)


class Cita(Base):
    __tablename__ = "citas"
    id             = Column(PGUUID(as_uuid=True), primary_key=True)
    paciente_id    = Column(PGUUID(as_uuid=True))
    medico_id      = Column(PGUUID(as_uuid=True))
    institucion_id = Column(PGUUID(as_uuid=True))
    fecha          = Column(Date)
    hora           = Column(String(10))
    especialidad   = Column(String(100))
    estado         = Column(String(20))
    motivo         = Column(String(300))


class Receta(Base):
    __tablename__ = "recetas"
    id           = Column(PGUUID(as_uuid=True), primary_key=True)
    paciente_id  = Column(PGUUID(as_uuid=True))
    consulta_id  = Column(PGUUID(as_uuid=True))
    medico_id    = Column(PGUUID(as_uuid=True))
    fecha        = Column(Date)
    medicamento  = Column(String(200))
    dosis        = Column(String(50))
    frecuencia   = Column(String(100))
    duracion     = Column(String(50))
    indicaciones = Column(String)


class Estudio(Base):
    __tablename__ = "estudios"
    id          = Column(PGUUID(as_uuid=True), primary_key=True)
    paciente_id = Column(PGUUID(as_uuid=True))
    consulta_id = Column(PGUUID(as_uuid=True))
    fecha       = Column(Date)
    tipo        = Column(String(50))
    nombre      = Column(String(200))
    resultado   = Column(String)
    unidades    = Column(String(50))
