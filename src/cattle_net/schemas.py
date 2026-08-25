from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class PredictionItem(BaseModel):
    breed: str
    confidence: float


class PredictionResponse(BaseModel):
    model_version: str
    predictions: list[PredictionItem]


class PredictionHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    model_version: str
    predictions: list[PredictionItem]
    created_at: datetime


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


class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=120)
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CattleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    breed: str = Field(min_length=1, max_length=120)
    date_of_birth: date | None = None


class CattleResponse(CattleCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class DietPlanCreate(BaseModel):
    cattle_id: int = Field(gt=0)
    fodder_kg_per_day: float = Field(gt=0)
    concentrate_kg_per_day: float = Field(ge=0)
    supplements: str | None = Field(default=None, max_length=2_000)
    notes: str | None = Field(default=None, max_length=2_000)


class DietPlanResponse(DietPlanCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class VaccinationCreate(BaseModel):
    cattle_id: int = Field(gt=0)
    vaccine_name: str = Field(min_length=1, max_length=120)
    administered_on: date
    next_due_on: date
    notes: str | None = Field(default=None, max_length=2_000)

    @model_validator(mode="after")
    def validate_due_date(self) -> "VaccinationCreate":
        if self.next_due_on < self.administered_on:
            raise ValueError("next_due_on cannot be before administered_on")
        return self


class VaccinationResponse(VaccinationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
