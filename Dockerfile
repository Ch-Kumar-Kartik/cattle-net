FROM python:3.12-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:0.11.29 /uv /uvx /bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_CACHE=1 \
    UV_PYTHON_DOWNLOADS=0

COPY pyproject.toml uv.lock README.md ./

RUN uv sync --frozen --no-dev --extra cpu --no-install-project

COPY src/cattle_net ./src/cattle_net
COPY artifacts/cattle_resnet18_v1.pth artifacts/classes.json ./artifacts/
COPY alembic ./alembic
COPY alembic.ini ./

FROM python:3.12-slim

WORKDIR /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONPATH="/app/src" \
    MODEL_DEVICE=cpu \
    PORT=8080

COPY --from=builder /app /app

EXPOSE 8080

CMD ["sh", "-c", "exec uvicorn cattle_net.main:app --host 0.0.0.0 --port \"${PORT:-8080}\" --workers 1"]
