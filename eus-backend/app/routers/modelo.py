"""
modelo.py

CÓMPUTO COGNITIVO:
  Regresión logística sobre signos vitales reales de un paciente.
  Cuando se predice para un paciente, también se calcula el
  vector completo de scores con NumPy para obtener el percentil
  del paciente dentro de la población.

CÓMPUTO DE ALTO RENDIMIENTO:
  - NumPy vectorizado para el cálculo en lote (una sola operación
    matricial sobre todos los pacientes).
  - asyncio + asyncio.to_thread para la simulación de carga
    concurrente (N usuarios simultáneos sin bloquear el servidor).
"""
import asyncio
import math
import time
from uuid import UUID

import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.paciente import Paciente, SignosVitales

router = APIRouter(prefix="/modelo", tags=["Modelo de Riesgo"])

# ── Coeficientes ──────────────────────────────────────────────
BETA = {
    "intercepto":  -6.0,
    "sistolica":    0.015,   # recalibrado: normal=120 aporta 1.8 (antes 3.6)
    "glucosa":      0.008,   # recalibrado: normal=100 aporta 0.8 (antes 1.5)
    "fc":           0.010,   # recalibrado: normal=75  aporta 0.75
    "edad":         0.020,   # recalibrado: 40 años    aporta 0.8 (antes 1.6)
    "diabetes":     1.0,
    "hipertension": 0.8,
    # Resultado esperado con valores normales (sin condiciones):
    #   z ≈ -1.85  →  σ(z) ≈ 13.6%  → Bajo
}

def _nivel(score: float) -> str:
    if score >= 0.60: return "Alto"
    if score >= 0.30: return "Moderado"
    return "Bajo"

# ─────────────────────────────────────────────────────────────
# CÓMPUTO DE ALTO RENDIMIENTO 
# NumPy vectorizado
# ─────────────────────────────────────────────────────────────
def _scores_numpy(registros: list[dict]) -> np.ndarray:
    """
    Calcula el score logístico para TODOS los pacientes en una
    sola operación matricial con NumPy (sin for-loops).

    Construye 6 vectores (uno por variable) y aplica:
        z = β₀ + β₁·sistolica + ... (suma vectorial)
        σ(z) = 1 / (1 + e^{-z})    (elemento a elemento)
    """
    b = BETA
    sistolica    = np.array([r["sistolica"]    for r in registros], dtype=np.float32)
    glucosa      = np.array([r["glucosa"]      for r in registros], dtype=np.float32)
    fc           = np.array([r["fc"]           for r in registros], dtype=np.float32)
    edad         = np.array([r["edad"]         for r in registros], dtype=np.float32)
    diabetes     = np.array([r["diabetes"]     for r in registros], dtype=np.float32)
    hipertension = np.array([r["hipertension"] for r in registros], dtype=np.float32)

    z = (b["intercepto"]
         + b["sistolica"]    * sistolica
         + b["glucosa"]      * glucosa
         + b["fc"]           * fc
         + b["edad"]         * edad
         + b["diabetes"]     * diabetes
         + b["hipertension"] * hipertension)

    # np.clip evita overflow en exp; sigmoid vectorizada
    return 1.0 / (1.0 + np.exp(-np.clip(z, -500, 500)))


# ── GET /modelo/pacientes ─────────────────────────────────────
@router.get("/pacientes")
def listar_para_modelo(db: Session = Depends(get_db)):
    rows = db.query(
        Paciente.id, Paciente.nombre, Paciente.apellido_paterno,
        Paciente.apellido_materno, Paciente.curp,
    ).order_by(Paciente.apellido_paterno).all()
    return [
        {
            "id":    str(r.id),
            "label": f"{r.nombre} {r.apellido_paterno} {r.apellido_materno or ''}".strip(),
            "curp":  r.curp,
        }
        for r in rows
    ]


# ── GET /modelo/predecir/{paciente_id} ────────────────────────
@router.get("/predecir/{paciente_id}")
def predecir_paciente(paciente_id: UUID, db: Session = Depends(get_db)):
    """
    Cómputo Cognitivo + Alto Rendimiento:
    1. Calcula el riesgo del paciente seleccionado.
    2. Con NumPy vectorizado calcula el score de TODA la población
       para ubicar al paciente en un percentil.
    """
    pac = db.query(Paciente).filter(Paciente.id == paciente_id).first()
    if not pac:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    sv = (db.query(SignosVitales)
            .filter(SignosVitales.paciente_id == paciente_id)
            .order_by(SignosVitales.fecha.desc()).first())

    sistolica    = float(sv.presion_sistolica   or 120) if sv else 120.0
    glucosa      = float(sv.glucosa             or 100) if sv else 100.0
    fc           = float(sv.frecuencia_cardiaca or 75)  if sv else 75.0
    edad         = float(pac.edad or 40)
    diabetes     = bool(pac.tiene_diabetes)
    hipertension = bool(pac.tiene_hipertension)

    b = BETA
    desglose = {
        "intercepto":   b["intercepto"],
        "sistolica":    b["sistolica"]    * sistolica,
        "glucosa":      b["glucosa"]      * glucosa,
        "fc":           b["fc"]           * fc,
        "edad":         b["edad"]         * edad,
        "diabetes":     b["diabetes"]     * int(diabetes),
        "hipertension": b["hipertension"] * int(hipertension),
    }
    z_pac = sum(desglose.values())
    score_pac = float(1.0 / (1.0 + math.exp(-max(-500, min(500, z_pac)))))

    # ── NumPy: percentil en la población ─────────────────────
    t0 = time.perf_counter()
    todos = db.query(
        Paciente.id, Paciente.edad, Paciente.tiene_diabetes, Paciente.tiene_hipertension
    ).all()
    svs = db.query(SignosVitales).all()
    sv_map = {str(s.paciente_id): s for s in svs}

    registros = []
    for p in todos:
        pid = str(p.id)
        s = sv_map.get(pid)
        registros.append({
            "sistolica":    float(s.presion_sistolica   or 120) if s else 120.0,
            "glucosa":      float(s.glucosa             or 100) if s else 100.0,
            "fc":           float(s.frecuencia_cardiaca or 75)  if s else 75.0,
            "edad":         float(p.edad or 40),
            "diabetes":     float(p.tiene_diabetes or False),
            "hipertension": float(p.tiene_hipertension or False),
        })

    scores_todos = _scores_numpy(registros)      # ← operación vectorizada NumPy
    t_numpy = round((time.perf_counter() - t0) * 1000, 2)

    percentil = float(np.mean(scores_todos < score_pac) * 100)

    return {
        "paciente": {
            "nombre":       f"{pac.nombre} {pac.apellido_paterno}",
            "curp":         pac.curp,
            "edad":         pac.edad,
            "diabetes":     diabetes,
            "hipertension": hipertension,
        },
        "signos": {
            "sistolica": sistolica,
            "glucosa":   glucosa,
            "fc":        fc,
            "fecha":     str(sv.fecha) if sv else "Sin registros",
        },
        "resultado": {
            "score":        round(score_pac, 4),
            "nivel_riesgo": _nivel(score_pac),
            "z":            round(z_pac, 4),
            "desglose":     {k: round(v, 4) for k, v in desglose.items()},
        },
        "poblacion": {
            "n_pacientes":      len(registros),
            "score_promedio":   round(float(np.mean(scores_todos)), 4),
            "percentil":        round(percentil, 1),
            "tiempo_numpy_ms":  t_numpy,
            "metodo":           "NumPy vectorizado — una operación matricial",
        },
    }


# ─────────────────────────────────────────────────────────────
# CÓMPUTO DE ALTO RENDIMIENTO
# Simulación de carga concurrente
# asyncio.to_thread ejecuta funciones síncronas en un thread
# pool, permitiendo concurrencia real sin bloquear el event loop
# ─────────────────────────────────────────────────────────────

def _consulta_sync(paciente_id: str, db_url: str) -> dict:
    """
    Función SÍNCRONA que simula el trabajo de un usuario.
    Se ejecuta en un hilo separado via asyncio.to_thread.
    Cada llamada abre su propia conexión a la BD.
    """
    import psycopg2

    t0 = time.perf_counter()
    conn = psycopg2.connect(db_url)
    cur  = conn.cursor()

    cur.execute(
        "SELECT edad, tiene_diabetes, tiene_hipertension FROM pacientes WHERE id = %s",
        (paciente_id,)
    )
    pac = cur.fetchone()

    cur.execute(
        "SELECT presion_sistolica, glucosa, frecuencia_cardiaca "
        "FROM signos_vitales WHERE paciente_id = %s "
        "ORDER BY fecha DESC LIMIT 1",
        (paciente_id,)
    )
    sv = cur.fetchone()
    conn.close()

    if pac and sv:
        b = BETA
        z = (b["intercepto"]
             + b["sistolica"]    * float(sv[0] or 120)
             + b["glucosa"]      * float(sv[1] or 100)
             + b["fc"]           * float(sv[2] or 75)
             + b["edad"]         * float(pac[0] or 40)
             + b["diabetes"]     * float(pac[1] or False)
             + b["hipertension"] * float(pac[2] or False))
        score = float(1.0 / (1.0 + math.exp(-max(-500, min(500, z)))))
        nivel = _nivel(score)
    else:
        score, nivel = 0.0, "Bajo"

    return {
        "score":     round(score, 4),
        "nivel":     nivel,
        "tiempo_ms": round((time.perf_counter() - t0) * 1000, 2),
    }


@router.get("/carga-concurrente")
async def carga_concurrente(
    n_usuarios: int = 10,
    db: Session = Depends(get_db),
):
    """
    Cómputo de Alto Rendimiento — simulación de carga.

    SECUENCIAL: procesa cada usuario uno por uno (await en loop).
    CONCURRENTE: asyncio.gather + asyncio.to_thread lanza todos
                 los usuarios al mismo tiempo en hilos separados,
                 sin bloquear el event loop del servidor.
    """
    from app.config import get_settings
    db_url = str(get_settings().DATABASE_URL)

    ids_db = [str(r.id) for r in db.query(Paciente.id).limit(50).all()]
    if not ids_db:
        return {"error": "Sin pacientes en la BD"}

    ids_muestra = [ids_db[i % len(ids_db)] for i in range(n_usuarios)]

    # ── SECUENCIAL ────────────────────────────────────────────
    t_seq0 = time.perf_counter()
    resultados_seq = []
    for pid in ids_muestra:
        # to_thread pero esperado uno por uno = secuencial
        r = await asyncio.to_thread(_consulta_sync, pid, db_url)
        resultados_seq.append(r)
    t_seq = time.perf_counter() - t_seq0

    # ── CONCURRENTE (asyncio.gather + to_thread) ──────────────
    # asyncio.gather lanza TODOS a la vez.
    # to_thread envía cada tarea a un hilo del thread pool,
    # liberando el event loop mientras espera la BD.
    t_con0 = time.perf_counter()
    resultados_con = await asyncio.gather(
        *[asyncio.to_thread(_consulta_sync, pid, db_url) for pid in ids_muestra]
    )
    t_con = time.perf_counter() - t_con0

    tiempos_con = [r["tiempo_ms"] for r in resultados_con]
    speedup = round(t_seq / t_con, 2) if t_con > 0 else 1.0

    return {
        "n_usuarios_simulados": n_usuarios,
        "secuencial": {
            "tiempo_total_ms":  round(t_seq * 1000, 2),
            "requests_por_seg": round(n_usuarios / t_seq) if t_seq > 0 else 0,
            "metodo":           "await uno por uno (secuencial)",
        },
        "concurrente": {
            "tiempo_total_ms":    round(t_con * 1000, 2),
            "requests_por_seg":   round(n_usuarios / t_con) if t_con > 0 else 0,
            "tiempo_promedio_ms": round(sum(tiempos_con) / len(tiempos_con), 2),
            "metodo":             "asyncio.gather + asyncio.to_thread (hilos paralelos)",
        },
        "speedup":    speedup,
        "tecnologia": "asyncio.gather + asyncio.to_thread",
        "nota": (
            "asyncio.to_thread mueve cada consulta a un hilo del ThreadPoolExecutor. "
            "asyncio.gather los lanza todos a la vez. "
            "El event loop no se bloquea mientras esperan respuesta de la BD."
        ),
    }
