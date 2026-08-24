from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth_routes import router as auth_router
from .classifier import CattleClassifier
from .database import engine
from .models import Base
from .routes import router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.cattle_classifier = CattleClassifier()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    del app.state.cattle_classifier
    await engine.dispose()


app = FastAPI(lifespan=lifespan)
app.include_router(router)

app.include_router(auth_router)

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
