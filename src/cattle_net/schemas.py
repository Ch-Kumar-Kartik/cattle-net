from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PredictionItem(BaseModel):
    breed: str
    confidence: float


class PredictionResponse(BaseModel):
    model_version: str
    predictions: list[PredictionItem]


class HealthResponse(BaseModel):
    status: str
    classifier_loaded: bool
    device: str
    model_version: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    created_at: datetime


class RegisterRequest(BaseModel):
    email: EmailStr = Field(max_length=120)
    password: str
