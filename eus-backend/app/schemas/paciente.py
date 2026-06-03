from pydantic import BaseModel
from datetime import date
from uuid import UUID
from typing import Optional


class SignosVitalesOut(BaseModel):
    presion_sistolica:   Optional[int]
    presion_diastolica:  Optional[int]
    frecuencia_cardiaca: Optional[int]
    temperatura:         Optional[float]
    peso:                Optional[float]
    altura:              Optional[float]
    imc:                 Optional[float]
    glucosa:             Optional[float]
    saturacion_oxigeno:  Optional[int]
    model_config = {"from_attributes": True}


class RiesgoOut(BaseModel):
    score_riesgo_cardiovascular:   Optional[float]
    score_riesgo_complicacion_dm2: Optional[float]
    nivel_riesgo:                  Optional[str]
    modelo_version:                Optional[str]
    fecha_calculo:                 Optional[date]
    model_config = {"from_attributes": True}


class ConsultaOut(BaseModel):
    id:                UUID
    fecha:             Optional[date]
    especialidad:      Optional[str]
    motivo_consulta:   Optional[str]
    diagnostico:       Optional[str]
    diagnostico_cie10: Optional[str]
    tratamiento:       Optional[str]
    tipo_atencion:     Optional[str]
    signos_vitales:    Optional[SignosVitalesOut] = None
    model_config = {"from_attributes": True}


class PacienteOut(BaseModel):
    id:                   UUID
    curp:                 str
    nombre:               Optional[str]
    apellido_paterno:     Optional[str]
    apellido_materno:     Optional[str]
    fecha_nacimiento:     Optional[date]
    edad:                 Optional[int]
    sexo:                 Optional[str]
    tipo_sangre:          Optional[str]
    telefono:             Optional[str]
    email:                Optional[str]
    estado_residencia:    Optional[str]
    alergias:             Optional[str]
    enfermedades_cronicas: Optional[str]
    tiene_diabetes:       Optional[bool]
    tiene_hipertension:   Optional[bool]
    tiene_asma:           Optional[bool]
    model_config = {"from_attributes": True}


class PacienteDetalle(PacienteOut):
    consultas: list[ConsultaOut] = []
    riesgo:    Optional[RiesgoOut] = None
