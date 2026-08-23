from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from PIL import Image, UnidentifiedImageError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .dependencies import CurrentUser
from .models import PredictionRecord
from .schemas import (
    HealthResponse,
    PredictionHistoryItem,
    PredictionItem,
    PredictionResponse,
)

router = APIRouter()
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


@router.get("/health", response_model=HealthResponse)
def health_check(request: Request, current_user: CurrentUser) -> HealthResponse:
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


@router.get(
    "/api/v1/predictions/history",
    response_model=list[PredictionHistoryItem],
)
async def list_prediction_history(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[PredictionRecord]:
    result = await db.execute(
        select(PredictionRecord)
        .where(PredictionRecord.user_id == current_user.id)
        .order_by(PredictionRecord.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("/api/v1/predictions", response_model=PredictionResponse)
async def create_prediction(
    request: Request,
    file: Annotated[UploadFile, File(...)],
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> PredictionResponse:
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image type",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Size limit exceeded: maximum upload size is 5 MB",
        )

    try:
        with Image.open(BytesIO(image_bytes)) as image:
            image.load()

            width, height = image.size

            if width < 1 or height < 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Image dimensions must be greater than zero",
                )

            classifier = getattr(request.app.state, "cattle_classifier", None)
            if classifier is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Classifier is not loaded",
                )

            predictions = classifier.predict(image)

    except (UnidentifiedImageError, OSError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not a valid image",
        ) from exc

    api_predictions = [
        PredictionItem(
            breed=prediction.label,
            confidence=prediction.confidence,
        )
        for prediction in predictions
    ]

    db.add(
        PredictionRecord(
            user_id=current_user.id,
            model_version=classifier.model_version,
            predictions=[prediction.model_dump() for prediction in api_predictions],
        )
    )
    await db.commit()

    return PredictionResponse(
        model_version=classifier.model_version,
        predictions=api_predictions,
    )
