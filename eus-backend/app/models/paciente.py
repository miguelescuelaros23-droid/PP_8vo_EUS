from sqlalchemy import Column, String, Date, Boolean, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Paciente(Base):
    __tablename__ = "pacientes"

    id                  = Column(UUID(as_uuid=True), primary_key=True)
    curp                = Column(String(18), unique=True, nullable=False)
    nombre              = Column(String(100))
    apellido_paterno    = Column(String(80))
    apellido_materno    = Column(String(80))
    fecha_nacimiento    = Column(Date)
    edad                = Column(Integer)
    sexo                = Column(String(5))
    tipo_sangre         = Column(String(5))
    telefono            = Column(String(25))
    email               = Column(String(100))
    estado_residencia   = Column(String(50))
    alergias            = Column(String(300))
    enfermedades_cronicas = Column(String(300))
    tiene_diabetes      = Column(Boolean, default=False)
    tiene_hipertension  = Column(Boolean, default=False)
    tiene_asma          = Column(Boolean, default=False)


class Consulta(Base):
    __tablename__ = "consultas"

    id                = Column(UUID(as_uuid=True), primary_key=True)
    paciente_id       = Column(UUID(as_uuid=True))
    medico_id         = Column(UUID(as_uuid=True))
    institucion_id    = Column(UUID(as_uuid=True))
    fecha             = Column(Date)
    especialidad      = Column(String(100))
    motivo_consulta   = Column(String(300))
    diagnostico       = Column(String(300))
    diagnostico_cie10 = Column(String(10))
    tratamiento       = Column(String)
    tipo_atencion     = Column(String(50))
    notas_adicionales = Column(String)


class SignosVitales(Base):
    __tablename__ = "signos_vitales"

    id                  = Column(UUID(as_uuid=True), primary_key=True)
    paciente_id         = Column(UUID(as_uuid=True))
    consulta_id         = Column(UUID(as_uuid=True))
    fecha               = Column(Date)
    presion_sistolica   = Column(Integer)
    presion_diastolica  = Column(Integer)
    frecuencia_cardiaca = Column(Integer)
    temperatura         = Column(Numeric(4, 1))
    peso                = Column(Numeric(5, 1))
    altura              = Column(Numeric(4, 2))
    imc                 = Column(Numeric(5, 2))
    glucosa             = Column(Numeric(6, 1))
    saturacion_oxigeno  = Column(Integer)


class RiesgoClinico(Base):
    __tablename__ = "riesgo_clinico"

    id                            = Column(UUID(as_uuid=True), primary_key=True)
    paciente_id                   = Column(UUID(as_uuid=True))
    fecha_calculo                 = Column(Date)
    modelo_version                = Column(String(30))
    edad                          = Column(Integer)
    sexo                          = Column(String(5))
    tiene_diabetes                = Column(Boolean)
    tiene_hipertension            = Column(Boolean)
    imc_promedio                  = Column(Numeric(5, 2))
    glucosa_promedio              = Column(Numeric(6, 2))
    glucosa_maxima                = Column(Numeric(6, 2))
    pa_sistolica_promedio         = Column(Numeric(5, 2))
    pa_diastolica_promedio        = Column(Numeric(5, 2))
    num_consultas                 = Column(Integer)
    score_riesgo_cardiovascular   = Column(Numeric(6, 4))
    score_riesgo_complicacion_dm2 = Column(Numeric(6, 4))
    nivel_riesgo                  = Column(String(10))
