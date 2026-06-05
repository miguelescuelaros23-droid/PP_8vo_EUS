# ============================================================
# main.py — Punto de entrada de la API FastAPI
#
# Para arrancar:
#   uvicorn app.main:app --reload --port 8000
#
# Documentación interactiva automática en:
#   http://localhost:8000/docs      ← Swagger UI
#   http://localhost:8000/redoc     ← ReDoc
# ============================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, pacientes, analitica, modelo

# ── Crear la app ──────────────────────────────────────────────
app = FastAPI(
    title="EUS México — API",
    description="API REST para el Expediente Único de Salud. Proyecto integrador UNRC.",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────
# Permite que el frontend (React en localhost:5173) llame a esta API.
# En producción reemplaza "*" por la URL real de tu frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://pp-8vo-r4ivx7pq5-frontend-prototipico8vo-s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Registrar routers ─────────────────────────────────────────
# Cada router agrupa endpoints relacionados
app.include_router(auth.router)
app.include_router(pacientes.router)
app.include_router(analitica.router)
app.include_router(modelo.router)


# ── Endpoint de salud ─────────────────────────────────────────
@app.get("/health", tags=["Sistema"])
def health_check():
    """
    Verifica que la API esté viva.
    Útil para saber si el servidor arrancó correctamente.
    GET http://localhost:8000/health  →  {"status": "ok"}
    """
    return {"status": "ok", "sistema": "EUS México API v1.0"}
