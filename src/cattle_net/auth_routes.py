from fastapi import APIRouter, FastAPI, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
)

@router.post("/register")
async def func(request: Request, Annotated[AsyncSession, Depends(get_db)]):
    pass 