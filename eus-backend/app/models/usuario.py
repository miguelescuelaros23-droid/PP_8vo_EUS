# ============================================================
# models/usuario.py — Tabla "usuarios" (login del sistema)
# paciente_id y personal_id son mutuamente exclusivos:
#   - Si es paciente → paciente_id tiene valor, personal_id es NULL
#   - Si es personal → personal_id tiene valor, paciente_id es NULL
# ============================================================
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username      = Column(String(60), unique=True, nullable=False)
    password_hash = Column(String(64), nullable=False)   # SHA-256 → siempre 64 hex chars
    tipo_usuario  = Column(String(20), nullable=False)   # paciente | medico | enfermero | admin
    paciente_id   = Column(UUID(as_uuid=True), ForeignKey("pacientes.id"), nullable=True)
    personal_id   = Column(UUID(as_uuid=True), ForeignKey("personal.id"), nullable=True)
    activo        = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    ultimo_acceso  = Column(DateTime(timezone=True), nullable=True)
