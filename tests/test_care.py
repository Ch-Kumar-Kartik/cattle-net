import asyncio
from datetime import date
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from cattle_net.care_routes import (
    create_diet_plan,
    get_owned_cattle,
    list_upcoming_vaccinations,
)
from cattle_net.models import DietPlan, VaccinationRecord
from cattle_net.schemas import DietPlanCreate, VaccinationCreate


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
    def __init__(self, results) -> None:
        self.results = list(results)
        self.added = []
        self.committed = False
        self.statements = []

    async def execute(self, statement):
        self.statements.append(statement)
        return FakeResult(self.results.pop(0))

    def add(self, item) -> None:
        self.added.append(item)

    async def commit(self) -> None:
        self.committed = True

    async def refresh(self, item) -> None:
        return None


def test_diet_plan_is_saved_only_for_owned_cattle():
    user = SimpleNamespace(id=1)
    cattle = SimpleNamespace(id=3, user_id=user.id)
    session = FakeSession([cattle])

    async def exercise() -> None:
        plan = await create_diet_plan(
            DietPlanCreate(
                cattle_id=3,
                fodder_kg_per_day=8.5,
                concentrate_kg_per_day=2.0,
                supplements="Mineral mix",
            ),
            user,
            session,
        )

        assert isinstance(plan, DietPlan)
        assert session.added == [plan]
        assert session.committed is True
        assert plan.cattle_id == cattle.id

    asyncio.run(exercise())


def test_missing_or_unowned_cattle_returns_not_found():
    session = FakeSession([None])

    async def exercise() -> None:
        with pytest.raises(HTTPException) as error:
            await get_owned_cattle(3, SimpleNamespace(id=1), session)
        assert error.value.status_code == 404

    asyncio.run(exercise())


def test_upcoming_vaccinations_are_scoped_to_the_current_user():
    user = SimpleNamespace(id=1)
    record = VaccinationRecord(
        id=1,
        cattle_id=3,
        vaccine_name="FMD",
        administered_on=date(2026, 1, 1),
        next_due_on=date(2026, 8, 30),
    )
    session = FakeSession([[record]])

    async def exercise() -> None:
        records = await list_upcoming_vaccinations(user, session, days=30)

        assert records == [record]
        compiled_query = str(session.statements[0].compile())
        assert "cattle.user_id" in compiled_query
        assert "vaccination_records.next_due_on" in compiled_query

    asyncio.run(exercise())


def test_vaccination_due_date_cannot_precede_administered_date():
    with pytest.raises(ValidationError):
        VaccinationCreate(
            cattle_id=1,
            vaccine_name="FMD",
            administered_on=date(2026, 8, 10),
            next_due_on=date(2026, 8, 9),
        )
