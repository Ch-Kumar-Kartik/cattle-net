from pydantic import BaseModel


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
