from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.database import get_db
from app.models.paciente import Paciente, Consulta, RiesgoClinico
from app.models.auxiliares import Personal, Institucion, Receta, Estudio

router = APIRouter(prefix="/analitica", tags=["Analítica"])


# ── /analitica/medico/{personal_id} ───────────────────────────
@router.get("/medico/{personal_id}")
def analitica_medico(personal_id: UUID, db: Session = Depends(get_db)):
    """
    Estadísticas relevantes para el médico autenticado.
    Filtra por su propia institución y sector (público o privado).
    Un médico privado no ve datos de instituciones públicas y viceversa.
    """
    personal = db.query(Personal).filter(Personal.id == personal_id).first()
    if not personal:
        raise HTTPException(status_code=404, detail="Personal no encontrado")

    inst = db.query(Institucion).filter(
        Institucion.id == personal.institucion_id
    ).first()

    sector_tipo = inst.tipo if inst else None   # "Publica" | "Privada"
    sector_nombre = inst.sector if inst else "N/A"

    # IDs de instituciones del mismo tipo (público o privado)
    if sector_tipo:
        inst_ids = [
            str(r.id) for r in
            db.query(Institucion.id).filter(Institucion.tipo == sector_tipo).all()
        ]
    else:
        inst_ids = []

    mid = str(personal_id)

    # Consultas del médico
    total_consultas = db.query(func.count(Consulta.id)).filter(
        Consulta.medico_id == personal_id
    ).scalar()

    # Pacientes únicos atendidos
    pacientes_unicos = db.query(func.count(func.distinct(Consulta.paciente_id))).filter(
        Consulta.medico_id == personal_id
    ).scalar()

    # Recetas emitidas
    total_recetas = db.query(func.count(Receta.id)).filter(
        Receta.medico_id == personal_id
    ).scalar()

    # Estudios ordenados en sus consultas
    estudios_ids = [
        str(r.id) for r in
        db.query(Consulta.id).filter(Consulta.medico_id == personal_id).all()
    ]
    total_estudios = db.query(func.count(Estudio.id)).filter(
        Estudio.consulta_id.in_(estudios_ids)
    ).scalar() if estudios_ids else 0

    # Top 5 diagnósticos propios
    top_diag = (
        db.query(Consulta.diagnostico, func.count(Consulta.id).label("n"))
        .filter(Consulta.medico_id == personal_id, Consulta.diagnostico.isnot(None))
        .group_by(Consulta.diagnostico)
        .order_by(func.count(Consulta.id).desc())
        .limit(5).all()
    )

    # Top 5 especialidades propias
    top_esp = (
        db.query(Consulta.especialidad, func.count(Consulta.id).label("n"))
        .filter(Consulta.medico_id == personal_id, Consulta.especialidad.isnot(None))
        .group_by(Consulta.especialidad)
        .order_by(func.count(Consulta.id).desc())
        .limit(5).all()
    )

    # Consultas por mes (últimos 6 meses) — del médico
    consultas_mes = (
        db.query(
            func.to_char(Consulta.fecha, 'Mon').label("mes"),
            func.count(Consulta.id).label("consultas")
        )
        .filter(Consulta.medico_id == personal_id, Consulta.fecha.isnot(None))
        .group_by(func.to_char(Consulta.fecha, 'Mon'), func.date_trunc('month', Consulta.fecha))
        .order_by(func.date_trunc('month', Consulta.fecha))
        .limit(6).all()
    )

    return {
        "medico": {
            "nombre":       personal.nombre_completo,
            "tipo":         personal.tipo,
            "sector":       sector_nombre,
            "sector_tipo":  sector_tipo,
        },
        "resumen": {
            "total_consultas":    total_consultas,
            "pacientes_unicos":   pacientes_unicos,
            "total_recetas":      total_recetas,
            "total_estudios":     total_estudios,
        },
        "top_diagnosticos": [{"diagnostico": d, "casos": n} for d, n in top_diag],
        "top_especialidades": [{"especialidad": e, "consultas": n} for e, n in top_esp],
        "consultas_por_mes": [{"mes": m, "consultas": n} for m, n in consultas_mes],
    }


# ── /analitica/admin ──────────────────────────────────────────
@router.get("/admin")
def analitica_admin(db: Session = Depends(get_db)):
    """
    Vista administrativa: estadísticas generales, por sector,
    por médico y por tipo de personal. Ve datos de todos los sectores.
    """
    # Totales generales
    total_pacientes   = db.query(func.count(Paciente.id)).scalar()
    total_consultas   = db.query(func.count(Consulta.id)).scalar()
    total_personal    = db.query(func.count(Personal.id)).filter(Personal.activo == True).scalar()
    total_recetas     = db.query(func.count(Receta.id)).scalar()
    total_estudios    = db.query(func.count(Estudio.id)).scalar()

    # Consultas por sector
    consultas_sector = (
        db.query(Institucion.sector, func.count(Consulta.id).label("consultas"))
        .join(Consulta, Consulta.institucion_id == Institucion.id)
        .group_by(Institucion.sector)
        .order_by(func.count(Consulta.id).desc())
        .all()
    )

    # Consultas por tipo de institución (Publica / Privada)
    consultas_tipo = (
        db.query(Institucion.tipo, func.count(Consulta.id).label("consultas"))
        .join(Consulta, Consulta.institucion_id == Institucion.id)
        .group_by(Institucion.tipo)
        .all()
    )

    # Top 5 médicos por número de consultas
    top_medicos = (
        db.query(Personal.nombre_completo, func.count(Consulta.id).label("consultas"))
        .join(Consulta, Consulta.medico_id == Personal.id)
        .filter(Personal.tipo == "Medico")
        .group_by(Personal.nombre_completo)
        .order_by(func.count(Consulta.id).desc())
        .limit(5).all()
    )

    # Personal por tipo
    personal_tipo = (
        db.query(Personal.tipo, func.count(Personal.id).label("cantidad"))
        .filter(Personal.activo == True)
        .group_by(Personal.tipo)
        .order_by(func.count(Personal.id).desc())
        .all()
    )

    # Top 5 diagnósticos globales
    top_diag = (
        db.query(Consulta.diagnostico, func.count(Consulta.id).label("casos"))
        .filter(Consulta.diagnostico.isnot(None))
        .group_by(Consulta.diagnostico)
        .order_by(func.count(Consulta.id).desc())
        .limit(5).all()
    )

    # Distribución de riesgo cardiovascular
    riesgo_dist = (
        db.query(RiesgoClinico.nivel_riesgo, func.count(RiesgoClinico.id).label("cantidad"))
        .filter(RiesgoClinico.nivel_riesgo.isnot(None))
        .group_by(RiesgoClinico.nivel_riesgo)
        .all()
    )
    color_map = {"Bajo": "#22c55e", "Moderado": "#f59e0b", "Alto": "#ef4444"}

    return {
        "resumen": {
            "total_pacientes":  total_pacientes,
            "total_consultas":  total_consultas,
            "total_personal":   total_personal,
            "total_recetas":    total_recetas,
            "total_estudios":   total_estudios,
        },
        "consultas_por_sector": [
            {"sector": s, "consultas": n} for s, n in consultas_sector
        ],
        "consultas_por_tipo": [
            {"tipo": t, "consultas": n} for t, n in consultas_tipo
        ],
        "top_medicos": [
            {"medico": m, "consultas": n} for m, n in top_medicos
        ],
        "personal_por_tipo": [
            {"tipo": t, "cantidad": n} for t, n in personal_tipo
        ],
        "top_diagnosticos": [
            {"diagnostico": d, "casos": n} for d, n in top_diag
        ],
        "distribucion_riesgo": [
            {"nivel": nv, "cantidad": cnt, "color": color_map.get(nv, "#94a3b8")}
            for nv, cnt in riesgo_dist
        ],
    }


# ── /analitica/resumen (existente, sin cambios) ───────────────
@router.get("/resumen")
def resumen(db: Session = Depends(get_db)):
    total_pacientes = db.query(func.count(Paciente.id)).scalar()
    diag_raw = (
        db.query(Consulta.diagnostico, func.count(Consulta.id).label("casos"))
        .filter(Consulta.diagnostico.isnot(None))
        .group_by(Consulta.diagnostico)
        .order_by(func.count(Consulta.id).desc())
        .limit(6).all()
    )
    riesgo_raw = (
        db.query(RiesgoClinico.nivel_riesgo, func.count(RiesgoClinico.id).label("cantidad"))
        .filter(RiesgoClinico.nivel_riesgo.isnot(None))
        .group_by(RiesgoClinico.nivel_riesgo).all()
    )
    color_map = {"Bajo": "#22c55e", "Moderado": "#f59e0b", "Alto": "#ef4444"}
    n_diabetes     = db.query(func.count(Paciente.id)).filter(Paciente.tiene_diabetes     == True).scalar()
    n_hipertension = db.query(func.count(Paciente.id)).filter(Paciente.tiene_hipertension == True).scalar()
    n_asma         = db.query(func.count(Paciente.id)).filter(Paciente.tiene_asma         == True).scalar()
    return {
        "total_pacientes": total_pacientes,
        "distribucion_diagnosticos": [{"diagnostico": d, "casos": c} for d, c in diag_raw],
        "distribucion_riesgo": [{"nivel": n, "cantidad": c, "color": color_map.get(n, "#94a3b8")} for n, c in riesgo_raw],
        "condiciones_cronicas": {"diabetes": n_diabetes, "hipertension": n_hipertension, "asma": n_asma},
    }
