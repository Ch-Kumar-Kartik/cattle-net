"""Password hashing and JWT helpers for authentication."""

from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from .config import settings

password_hash = PasswordHash.recommended()


def _get_secret_key() -> str:
    if settings.jwt_secret_key is None:
        raise RuntimeError("JWT_SECRET_KEY must be set to use authentication.")
    secret_key = settings.jwt_secret_key.get_secret_value()
    if len(secret_key.encode()) < 32:
        raise RuntimeError("JWT_SECRET_KEY must be at least 32 bytes long.")
    return secret_key


def hash_password(password: str) -> str:
    """Return a secure hash to store instead of the plaintext password."""
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return whether a plaintext password matches its stored hash."""
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(
    user_id: int,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT whose subject identifies one user."""
    expires_at = datetime.now(UTC) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload = {"sub": str(user_id), "exp": expires_at}
    return jwt.encode(payload, _get_secret_key(), algorithm=settings.algorithm)


def verify_access_token(token: str) -> int | None:
    """Return the user ID in a valid token, or None for an invalid token."""
    try:
        payload = jwt.decode(
            token,
            _get_secret_key(),
            algorithms=[settings.algorithm],
            options={"require": ["exp", "sub"]},
        )
        return int(payload["sub"])
    except (jwt.InvalidTokenError, TypeError, ValueError):
        return None
