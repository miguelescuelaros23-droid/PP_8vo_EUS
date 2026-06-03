# ============================================================
# schemas/auth.py — Formas de entrada/salida del login
# ============================================================
from pydantic import BaseModel
from typing import Optional


class TokenOut(BaseModel):
    """Lo que devuelve el endpoint de login"""
    access_token: str
    token_type: str = "bearer"
    rol: str
    username: str
    paciente_id: Optional[str] = None
    personal_id: Optional[str] = None


class TokenData(BaseModel):
    """Lo que guardamos dentro del JWT"""
    username: str
    rol: str
    paciente_id: Optional[str] = None
    personal_id: Optional[str] = None
