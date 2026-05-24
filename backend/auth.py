from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import logging
import os
import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import RolUsuario, Usuario

ADMIN_ROLES = {RolUsuario.SUPERADMIN, RolUsuario.ADMIN_TENANT}

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings — finalized in validate_secret_key() during app startup
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production").strip()
INSECURE_SECRET_KEYS = {
    "your-secret-key-change-in-production",
    "dev-secret-key-change-in-production-12345678",
}
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

logger = logging.getLogger(__name__)


def _is_insecure_secret(key: str) -> bool:
    return key in INSECURE_SECRET_KEYS or len(key) < 32


def _running_on_render() -> bool:
    return os.getenv("RENDER") == "true" or bool(os.getenv("RENDER_SERVICE_ID"))


def validate_secret_key() -> None:
    """Ensure JWT secret is usable; auto-generate on Render if missing."""
    global SECRET_KEY

    debug = os.getenv("DEBUG", "False").lower() == "true"
    configured = os.getenv("SECRET_KEY", "").strip()
    key = configured or SECRET_KEY

    if not _is_insecure_secret(key):
        SECRET_KEY = key
        return

    if debug:
        logger.warning("SECRET_KEY is insecure — acceptable only in DEBUG mode")
        SECRET_KEY = key
        return

    if _running_on_render() and not configured:
        key = secrets.token_urlsafe(48)
        SECRET_KEY = key
        os.environ["SECRET_KEY"] = key
        logger.warning(
            "SECRET_KEY not set on Render — using an ephemeral key. "
            "Add SECRET_KEY (32+ random chars) in Environment for stable sessions."
        )
        return

    raise RuntimeError(
        "SECRET_KEY must be a random string of at least 32 characters in production. "
        "In Render: Environment → SECRET_KEY → save and redeploy."
    )


def resolve_tenant_filter(user: Usuario | None, requested: int | None = None) -> int | None:
    """Non-superadmin users are always scoped to their tenant."""
    if user is None:
        return requested
    if user.rol == RolUsuario.SUPERADMIN:
        return requested
    return user.tenant_id


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()

    # PyJWT 2.x requires registered claims like `sub` to be strings.
    if to_encode.get("sub") is not None:
        to_encode["sub"] = str(to_encode["sub"])
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode JWT access token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.InvalidTokenError:
        return None


security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = select(Usuario).where(Usuario.id == int(user_id))
    usuario = db.execute(stmt).scalars().first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if not usuario.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )

    return usuario


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario | None:
    if credentials is None:
        return None

    payload = decode_access_token(credentials.credentials)
    if not payload:
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    stmt = select(Usuario).where(Usuario.id == int(user_id))
    usuario = db.execute(stmt).scalars().first()

    if not usuario or not usuario.activo:
        return None

    return usuario


async def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado",
        )
    return current_user
