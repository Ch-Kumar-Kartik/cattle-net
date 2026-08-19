from io import BytesIO
import os

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from PIL import Image, UnidentifiedImageError
from starlette.status import HTTP_404_NOT_FOUND
from .schemas import HealthResponse, PredictionItem, PredictionResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check(request: Request) -> HealthResponse:
    classifier = getattr(request.app.state, "cattle_classifier", None)

    if classifier is None:
        raise HTTPException(
            status_code=500,
            detail="Classifier is not loaded",
        )

    return HealthResponse(
        status="ok",
        classifier_loaded=True,
        device=str(classifier.device),
        model_version=classifier.model_version,
    )

@router.post("/api/v1/predictions", response_model=PredictionResponse)
async def create_prediction(request: Request, file: UploadFile) -> PredictionResponse:
    allowed_types = {"image/jpeg", "image/png", "image/webp",}

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=415,
            detail="Unsupported image type",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Please upload an appropriate image")

    if os.path.getsize(image_bytes) > 5 * 1024 * 1024:
        
