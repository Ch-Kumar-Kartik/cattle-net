"""Protected routes for user-owned cattle-care records."""

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .dependencies import CurrentUser
from .models import Cattle, DietPlan, VaccinationRecord
from .schemas import (
    CattleCreate,
    CattleResponse,
    DietPlanCreate,
    DietPlanResponse,
    VaccinationCreate,
    VaccinationResponse,
)

router = APIRouter(prefix="/api/v1/care", tags=["care"])


async def get_owned_cattle(
    cattle_id: int,
    current_user: CurrentUser,
    db: AsyncSession,
) -> Cattle:
    result = await db.execute(
        select(Cattle).where(
            Cattle.id == cattle_id,
            Cattle.user_id == current_user.id,
        )
    )
    cattle = result.scalar_one_or_none()
    if cattle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cattle record not found",
        )
    return cattle


@router.post(
    "/cattle", response_model=CattleResponse, status_code=status.HTTP_201_CREATED
)
async def create_cattle(
    payload: CattleCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Cattle:
    cattle = Cattle(user_id=current_user.id, **payload.model_dump())
    db.add(cattle)
    await db.commit()
    await db.refresh(cattle)
    return cattle


@router.get("/cattle", response_model=list[CattleResponse])
async def list_cattle(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[Cattle]:
    result = await db.execute(
        select(Cattle)
        .where(Cattle.user_id == current_user.id)
        .order_by(Cattle.created_at.desc())
    )
    return list(result.scalars().all())


@router.post(
    "/diet-plans",
    response_model=DietPlanResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_diet_plan(
    payload: DietPlanCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DietPlan:
    await get_owned_cattle(payload.cattle_id, current_user, db)
    diet_plan = DietPlan(**payload.model_dump())
    db.add(diet_plan)
    await db.commit()
    await db.refresh(diet_plan)
    return diet_plan


@router.get("/cattle/{cattle_id}/diet-plans", response_model=list[DietPlanResponse])
async def list_diet_plans(
    cattle_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[DietPlan]:
    await get_owned_cattle(cattle_id, current_user, db)
    result = await db.execute(
        select(DietPlan)
        .where(DietPlan.cattle_id == cattle_id)
        .order_by(DietPlan.created_at.desc())
    )
    return list(result.scalars().all())


@router.post(
    "/vaccinations",
    response_model=VaccinationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_vaccination(
    payload: VaccinationCreate,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> VaccinationRecord:
    await get_owned_cattle(payload.cattle_id, current_user, db)
    vaccination = VaccinationRecord(**payload.model_dump())
    db.add(vaccination)
    await db.commit()
    await db.refresh(vaccination)
    return vaccination


@router.get(
    "/cattle/{cattle_id}/vaccinations",
    response_model=list[VaccinationResponse],
)
async def list_vaccinations(
    cattle_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[VaccinationRecord]:
    await get_owned_cattle(cattle_id, current_user, db)
    result = await db.execute(
        select(VaccinationRecord)
        .where(VaccinationRecord.cattle_id == cattle_id)
        .order_by(VaccinationRecord.next_due_on.asc())
    )
    return list(result.scalars().all())


@router.get("/vaccinations/upcoming", response_model=list[VaccinationResponse])
async def list_upcoming_vaccinations(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    days: Annotated[int, Query(ge=1, le=365)] = 30,
) -> list[VaccinationRecord]:
    due_by = datetime.now(UTC).date() + timedelta(days=days)
    result = await db.execute(
        select(VaccinationRecord)
        .join(Cattle, VaccinationRecord.cattle_id == Cattle.id)
        .where(
            Cattle.user_id == current_user.id,
            VaccinationRecord.next_due_on <= due_by,
        )
        .order_by(VaccinationRecord.next_due_on.asc())
    )
    return list(result.scalars().all())
