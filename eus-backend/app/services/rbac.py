# ============================================================
# services/rbac.py — Control de acceso por roles (RBAC)
#
# CIBERSEGURIDAD:
#   Ningún endpoint sensible es accesible sin un JWT válido.
#   require_roles() genera dependencias de FastAPI que bloquean
#   la petición si el usuario no tiene el rol correcto.
#
# Uso en un router:
#   @router.get("/pacientes")
#   def listar(usuario = Depends(require_roles("medico", "admin"))):
#       ...
# ============================================================
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.services.auth_service import decode_token
from app.schemas.auth import TokenData

# Le dice a FastAPI dónde está el endpoint de login para el "candado" de Swagger
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    """
    Dependencia base: extrae y valida el JWT de la cabecera Authorization.
    Si el token es inválido → 401 Unauthorized.
    """
    data = decode_token(token)
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return data


def require_roles(*roles: str):
    """
    Fábrica de dependencias: devuelve una función que verifica
    que el usuario autenticado tenga uno de los roles indicados.
    Si no → 403 Forbidden.

    Ejemplo: Depends(require_roles("medico", "admin"))
    """
    def checker(current_user: TokenData = Depends(get_current_user)) -> TokenData:
        if current_user.rol.lower() not in [r.lower() for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acceso restringido a: {', '.join(roles)}"
            )
        return current_user
    return checker
