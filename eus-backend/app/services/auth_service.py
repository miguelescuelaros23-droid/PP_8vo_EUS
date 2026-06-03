# ============================================================
# services/auth_service.py — Lógica de autenticación
#
# CIBERSEGURIDAD:
#   - Las contraseñas nunca se guardan en texto plano
#   - Se guardan como SHA-256 (64 caracteres hex)
#   - El JWT tiene tiempo de expiración configurable
#   - La clave secreta del JWT viene del .env
# ============================================================
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.usuario import Usuario
from app.schemas.auth import TokenData

settings = get_settings()


def hash_password(password: str) -> str:
    """
    Convierte una contraseña en texto a SHA-256.
    Ejemplo: hash_password("Pxgorc85") → "a3f9c2..."
    """
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """
    Compara la contraseña ingresada con el hash guardado en la BD.
    Nunca comparamos contraseñas en texto plano.
    """
    return hash_password(plain_password) == stored_hash


def authenticate_user(db: Session, username: str, password: str) -> Optional[Usuario]:
    """
    Busca el usuario en la BD y verifica su contraseña.
    Devuelve el objeto Usuario si es correcto, o None si no.
    """
    user = db.query(Usuario).filter(
        Usuario.username == username,
        Usuario.activo == True
    ).first()

    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_access_token(data: dict) -> str:
    """
    Crea un JWT firmado con SECRET_KEY.
    El token incluye el username, rol e IDs del usuario,
    y expira después de ACCESS_TOKEN_EXPIRE_MINUTES minutos.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[TokenData]:
    """
    Decodifica y valida un JWT.
    Si el token es inválido o expiró, devuelve None.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return TokenData(
            username=payload["sub"],
            rol=payload["rol"],
            paciente_id=payload.get("paciente_id"),
            personal_id=payload.get("personal_id"),
        )
    except JWTError:
        return None
