"""Password hashing and JWT helpers for authentication."""

import os
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

password_hash = PasswordHash.recommended()


def _get_secret_key() -> str:
    secret_key = os.getenv("JWT_SECRET_KEY")
    if not secret_key:
        raise RuntimeError("JWT_SECRET_KEY must be set to use authentication.")
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
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload = {"sub": str(user_id), "exp": expires_at}
    return jwt.encode(payload, _get_secret_key(), algorithm=ALGORITHM)


def verify_access_token(token: str) -> int | None:
    """Return the user ID in a valid token, or None for an invalid token."""
    try:
        payload = jwt.decode(
            token,
            _get_secret_key(),
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
        return int(payload["sub"])
    except (jwt.InvalidTokenError, TypeError, ValueError):
        return None
