from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .classifier import CattleClassifier
from .routes import router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.cattle_classifier = CattleClassifier()
    yield
    del app.state.cattle_classifier


app = FastAPI(lifespan=lifespan)
app.include_router(router)
