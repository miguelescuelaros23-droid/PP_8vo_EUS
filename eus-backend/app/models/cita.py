from sqlalchemy import Column, String, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Cita(Base):
    __tablename__ = "citas"

    id             = Column(UUID(as_uuid=True), primary_key=True)
    paciente_id    = Column(UUID(as_uuid=True))
    medico_id      = Column(UUID(as_uuid=True))
    institucion_id = Column(UUID(as_uuid=True))
    fecha          = Column(Date)
    hora           = Column(String(10))
    especialidad   = Column(String(100))
    estado         = Column(String(20))
    motivo         = Column(String(300))
