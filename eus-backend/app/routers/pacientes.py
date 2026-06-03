from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.database import get_db
from app.models.paciente import Paciente, Consulta, SignosVitales, RiesgoClinico
from app.models.auxiliares import Cita, Receta, Estudio
from app.schemas.paciente import PacienteOut, PacienteDetalle, ConsultaOut, SignosVitalesOut, RiesgoOut
from app.services.rbac import require_roles, get_current_user
from app.schemas.auth import TokenData

router = APIRouter(prefix="/pacientes", tags=["Pacientes"])


@router.get("/", response_model=list[PacienteOut])
def listar_pacientes(
    q: str = Query(default=None),
    db: Session = Depends(get_db),
    _: TokenData = Depends(require_roles("medico", "admin")),
):
    query = db.query(Paciente)
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(
            Paciente.nombre.ilike(like)         |
            Paciente.apellido_paterno.ilike(like)|
            Paciente.curp.ilike(like)
        )
    return query.order_by(Paciente.apellido_paterno).limit(100).all()


@router.get("/{paciente_id}", response_model=PacienteDetalle)
def obtener_paciente(
    paciente_id: UUID,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.rol == "paciente":
        if current_user.paciente_id != str(paciente_id):
            raise HTTPException(status_code=403, detail="Solo puedes ver tu propio expediente")

    paciente = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    # Consultas con sus signos vitales
    consultas_db = (
        db.query(Consulta)
        .filter(Consulta.paciente_id == paciente_id)
        .order_by(Consulta.fecha.desc())
        .limit(20)
        .all()
    )

    consultas_out = []
    for c in consultas_db:
        sv = db.query(SignosVitales).filter(SignosVitales.consulta_id == c.id).first()
        consultas_out.append(ConsultaOut(
            id=c.id,
            fecha=c.fecha,
            especialidad=c.especialidad,
            motivo_consulta=c.motivo_consulta,
            diagnostico=c.diagnostico,
            diagnostico_cie10=c.diagnostico_cie10,
            tratamiento=c.tratamiento,
            tipo_atencion=c.tipo_atencion,
            signos_vitales=SignosVitalesOut.model_validate(sv) if sv else None,
        ))

    # Score de riesgo más reciente
    riesgo = (
        db.query(RiesgoClinico)
        .filter(RiesgoClinico.paciente_id == paciente_id)
        .order_by(RiesgoClinico.fecha_calculo.desc())
        .first()
    )

    return PacienteDetalle(
        **PacienteOut.model_validate(paciente).model_dump(),
        consultas=consultas_out,
        riesgo=RiesgoOut.model_validate(riesgo) if riesgo else None,
    )


@router.get("/{paciente_id}/consultas", response_model=list[ConsultaOut])
def obtener_consultas(
    paciente_id: UUID,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.rol == "paciente":
        if current_user.paciente_id != str(paciente_id):
            raise HTTPException(status_code=403, detail="Acceso denegado")

    consultas_db = (
        db.query(Consulta)
        .filter(Consulta.paciente_id == paciente_id)
        .order_by(Consulta.fecha.desc())
        .all()
    )

    result = []
    for c in consultas_db:
        sv = db.query(SignosVitales).filter(SignosVitales.consulta_id == c.id).first()
        result.append(ConsultaOut(
            id=c.id,
            fecha=c.fecha,
            especialidad=c.especialidad,
            motivo_consulta=c.motivo_consulta,
            diagnostico=c.diagnostico,
            diagnostico_cie10=c.diagnostico_cie10,
            tratamiento=c.tratamiento,
            tipo_atencion=c.tipo_atencion,
            signos_vitales=SignosVitalesOut.model_validate(sv) if sv else None,
        ))
    return result


# ── GET /pacientes/{id}/citas ─────────────────────────────────
@router.get("/{paciente_id}/citas")
def obtener_citas(
    paciente_id: UUID,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.rol == "paciente" and current_user.paciente_id != str(paciente_id):
        raise HTTPException(status_code=403, detail="Acceso denegado")

    rows = (
        db.query(Cita)
        .filter(Cita.paciente_id == paciente_id)
        .order_by(Cita.fecha.desc())
        .all()
    )
    return [
        {
            "id":          str(r.id),
            "fecha":       str(r.fecha) if r.fecha else None,
            "hora":        r.hora,
            "especialidad":r.especialidad,
            "estado":      r.estado,
            "motivo":      r.motivo,
        }
        for r in rows
    ]


# ── GET /pacientes/{id}/recetas ───────────────────────────────
@router.get("/{paciente_id}/recetas")
def obtener_recetas(
    paciente_id: UUID,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.rol == "paciente" and current_user.paciente_id != str(paciente_id):
        raise HTTPException(status_code=403, detail="Acceso denegado")

    rows = (
        db.query(Receta)
        .filter(Receta.paciente_id == paciente_id)
        .order_by(Receta.fecha.desc())
        .all()
    )
    return [
        {
            "id":           str(r.id),
            "fecha":        str(r.fecha) if r.fecha else None,
            "medicamento":  r.medicamento,
            "dosis":        r.dosis,
            "frecuencia":   r.frecuencia,
            "duracion":     r.duracion,
            "indicaciones": r.indicaciones,
        }
        for r in rows
    ]


# ── GET /pacientes/{id}/estudios ──────────────────────────────
@router.get("/{paciente_id}/estudios")
def obtener_estudios(
    paciente_id: UUID,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    if current_user.rol == "paciente" and current_user.paciente_id != str(paciente_id):
        raise HTTPException(status_code=403, detail="Acceso denegado")

    rows = (
        db.query(Estudio)
        .filter(Estudio.paciente_id == paciente_id)
        .order_by(Estudio.fecha.desc())
        .all()
    )
    return [
        {
            "id":        str(r.id),
            "fecha":     str(r.fecha) if r.fecha else None,
            "tipo":      r.tipo,
            "nombre":    r.nombre,
            "resultado": r.resultado,
            "unidades":  r.unidades,
        }
        for r in rows
    ]
