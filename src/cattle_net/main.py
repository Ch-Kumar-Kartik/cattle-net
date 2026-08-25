from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth_routes import router as auth_router
from .care_routes import router as care_router
from .classifier import CattleClassifier
from .config import settings
from .database import engine
from .routes import router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.cattle_classifier = CattleClassifier(device=settings.model_device)
    yield
    del app.state.cattle_classifier
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
app.include_router(router)

app.include_router(auth_router)
app.include_router(care_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
