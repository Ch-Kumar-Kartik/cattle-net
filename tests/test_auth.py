import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import SecretStr

from cattle_net.auth import hash_password
from cattle_net.auth_routes import login_user, register_user
from cattle_net.config import settings
from cattle_net.dependencies import get_current_user
from cattle_net.models import PredictionRecord
from cattle_net.routes import list_prediction_history
from cattle_net.schemas import LoginRequest, RegisterRequest


class FakeResult:
    def __init__(self, value) -> None:
        self.value = value

    def scalar_one_or_none(self):
        return self.value

    def scalars(self):
        return self

    def all(self):
        return self.value


class FakeSession:
    def __init__(self, result) -> None:
        self.result = result
        self.added = []
        self.committed = False
        self.statement = None

    async def execute(self, statement):
        self.statement = statement
        return FakeResult(self.result)

    def add(self, item) -> None:
        self.added.append(item)

    async def commit(self) -> None:
        self.committed = True

    async def refresh(self, item) -> None:
        return None


def test_register_hashes_password_before_adding_user():
    async def exercise() -> None:
        session = FakeSession(None)

        user = await register_user(
            RegisterRequest(
                email="user@example.com",
                password="correct-password",
            ),
            session,
        )

        assert session.committed is True
        assert session.added == [user]
        assert user.email == "user@example.com"
        assert user.password_hash != "correct-password"

    asyncio.run(exercise())


def test_login_and_current_user_reject_invalid_credentials_and_tokens(monkeypatch):
    monkeypatch.setattr(
        settings,
        "jwt_secret_key",
        SecretStr("01234567890123456789012345678901"),
    )
    user = SimpleNamespace(
        id=1,
        email="user@example.com",
        password_hash=hash_password("correct-password"),
    )

    async def exercise() -> None:
        session = FakeSession(user)
        token_response = await login_user(
            LoginRequest(
                email="user@example.com",
                password="correct-password",
            ),
            session,
        )

        current_user = await get_current_user(
            HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials=token_response.access_token,
            ),
            session,
        )

        assert current_user is user
        assert token_response.token_type == "bearer"

        with pytest.raises(HTTPException) as error:
            await login_user(
                LoginRequest(
                    email="user@example.com",
                    password="wrong-password",
                ),
                session,
            )
        assert error.value.status_code == 401

        with pytest.raises(HTTPException) as error:
            await get_current_user(None, session)
        assert error.value.status_code == 401

        with pytest.raises(HTTPException) as error:
            await get_current_user(
                HTTPAuthorizationCredentials(
                    scheme="Bearer",
                    credentials="invalid-token",
                ),
                session,
            )
        assert error.value.status_code == 401

    asyncio.run(exercise())


def test_history_queries_only_the_current_users_records():
    first_user = SimpleNamespace(id=1)
    first_record = PredictionRecord(
        id=1,
        user_id=first_user.id,
        model_version="v1",
        predictions=[{"breed": "LOCAL", "confidence": 0.8}],
    )

    async def exercise() -> None:
        session = FakeSession([first_record])
        history = await list_prediction_history(first_user, session)

        assert history == [first_record]
        compiled_query = str(session.statement.compile())
        assert "prediction_records.user_id" in compiled_query
        assert "ORDER BY prediction_records.created_at DESC" in compiled_query
        assert first_user.id in session.statement.compile().params.values()

    asyncio.run(exercise())
