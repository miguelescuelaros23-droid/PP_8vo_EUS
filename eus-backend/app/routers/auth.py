# ============================================================
# routers/auth.py — Endpoint de login
#
# POST /auth/token
#   Recibe: username + password (form-data, estándar OAuth2)
#   Devuelve: JWT + rol + ids del usuario
#
# El frontend lo llama así (en api.ts):
#   const form = new URLSearchParams()
#   form.append('username', 'med.garcia')
#   form.append('password', 'med.garcia.pass')
#   axios.post('/auth/token', form)
# ============================================================
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import authenticate_user, create_access_token
from app.schemas.auth import TokenOut

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/token", response_model=TokenOut)
def login(
    form: OAuth2PasswordRequestForm = Depends(),  # lee username y password del form
    db: Session = Depends(get_db),
):
    """
    Login del sistema EUS.
    Devuelve un JWT que el frontend debe guardar y enviar
    en cada petición posterior como: Authorization: Bearer <token>
    """
    user = authenticate_user(db, form.username, form.password)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Construimos el payload del JWT con todo lo necesario
    token = create_access_token({
        "sub":          user.username,
        "rol":          user.tipo_usuario.lower(),
        "paciente_id":  str(user.paciente_id)  if user.paciente_id  else None,
        "personal_id":  str(user.personal_id)  if user.personal_id  else None,
    })

    # Normalizar rol a minúsculas para que el frontend lo maneje uniforme
    rol_normalizado = user.tipo_usuario.lower()

    return TokenOut(
        access_token=token,
        token_type="bearer",
        rol=rol_normalizado,
        username=user.username,
        paciente_id=str(user.paciente_id) if user.paciente_id else None,
        personal_id=str(user.personal_id) if user.personal_id else None,
    )
