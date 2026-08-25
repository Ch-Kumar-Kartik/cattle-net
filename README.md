# CattleCare AI

CattleCare AI is a full-stack cattle breed recognition and record-keeping
application. The FastAPI backend serves a trained ResNet-18 classifier and a
JWT-protected API for prediction history, cattle profiles, diet plans, and
vaccination records. The `frontend/` directory contains the Next.js client.

## Features

- Recognize one of eight cattle breeds from a JPEG, PNG, or WebP image.
- Return the top three predictions with confidence scores.
- Store prediction history per authenticated user.
- Create an account and authenticate with bearer tokens.
- Save cattle profiles, diet plans, and vaccination records.
- View vaccinations due within a chosen number of days.
- Run locally with SQLite or use PostgreSQL in production.
- Run inference with CUDA in local development or CPU-only PyTorch in Docker.

## Architecture

```text
Next.js frontend
        |
        | multipart image upload and JSON requests
        v
FastAPI API
        |
        +-- routes: HTTP validation, authentication, responses
        +-- classifier: Pillow preprocessing and PyTorch inference
        +-- SQLAlchemy: users, history, and cattle-care records
        v
SQLite locally or PostgreSQL in production
```

The model is loaded once during the FastAPI lifespan. Uploaded images are
processed in memory and are not stored permanently.

## Repository layout

```text
src/cattle_net/       FastAPI application
artifacts/            Required model checkpoint and class mapping
alembic/              Database migration environment and revisions
tests/                Backend tests
frontend/             Next.js application
scripts/              Standalone model utilities
```

## Prerequisites

- Python 3.12 or newer
- [uv](https://docs.astral.sh/uv/)
- Node.js and npm for the frontend
- Docker for the production container workflow

For local CUDA inference, install a PyTorch-compatible NVIDIA driver and CUDA
environment. CPU mode works without CUDA.

## Backend setup

Create the local configuration file from the checked-in template:

```sh
cp src/cattle_net/.env.example src/cattle_net/.env
```

Set a real `JWT_SECRET_KEY` in `src/cattle_net/.env`. Keep this file private.

### CUDA development

Install the CUDA PyTorch extra and choose CUDA explicitly:

```sh
uv sync --extra cuda
```

```dotenv
MODEL_DEVICE=cuda
```

The API fails at startup if CUDA is selected but unavailable.

### CPU development

Install the CPU PyTorch extra. CPU is the default model device.

```sh
uv sync --extra cpu
```

```dotenv
MODEL_DEVICE=cpu
```

The project uses uv's explicit PyTorch CPU and CUDA indexes. Do not install a
different PyTorch build manually into the project environment.

## Configuration

The backend reads configuration from `src/cattle_net/.env`. Environment
variables supplied by the shell or container platform override values in that
file.

| Variable | Default | Purpose |
| --- | --- | --- |
| `MODEL_DEVICE` | `cpu` | `cpu` or `cuda` inference device. |
| `DATABASE_URL` | `sqlite+aiosqlite:///./cattle-net.db` | Async SQLAlchemy database URL. |
| `JWT_SECRET_KEY` | none | Random secret used to sign access tokens. |
| `CORS_ALLOWED_ORIGINS` | local Next.js origins | Comma-separated permitted browser origins. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT lifetime in minutes. |
| `MAX_UPLOAD_SIZE_BYTES` | `5242880` | Maximum image upload size. |
| `PORT` | `8080` in Docker | Port used by the production container. |

Use an async PostgreSQL URL in production:

```text
postgresql+asyncpg://username:password@host:5432/database_name
```

Do not use `*` for `CORS_ALLOWED_ORIGINS`. Credentials are enabled, so allowed
origins must be explicit.

## Database migrations

Alembic owns schema changes. The FastAPI application does not create tables at
startup.

For local SQLite development:

```sh
uv run alembic upgrade head
```

Create a migration after changing SQLAlchemy models:

```sh
uv run alembic revision --autogenerate -m "describe the change"
uv run alembic upgrade head
```

For production, run migrations as a separate deployment step before starting
the web container:

```sh
docker run --rm \
  -e DATABASE_URL='postgresql+asyncpg://username:password@host:5432/database_name' \
  cattle-net:cpu alembic upgrade head
```

## Run the backend locally

Apply migrations, then start FastAPI:

```sh
uv run alembic upgrade head
uv run fastapi dev src/cattle_net/main.py
```

The API is available at `http://127.0.0.1:8000`. Interactive API docs are at
`http://127.0.0.1:8000/docs`.

## API overview

Except for registration and login, all routes require:

```text
Authorization: Bearer <access_token>
```

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Create a user account. |
| `POST` | `/api/v1/auth/login` | Receive an access token. |
| `GET` | `/health` | Confirm model availability and configured device. |
| `POST` | `/api/v1/predictions` | Classify an uploaded image. Field name: `file`. |
| `GET` | `/api/v1/predictions/history` | List the current user's prediction history. |
| `POST`, `GET` | `/api/v1/care/cattle` | Create or list the current user's cattle. |
| `POST` | `/api/v1/care/diet-plans` | Save a diet plan for owned cattle. |
| `GET` | `/api/v1/care/cattle/{cattle_id}/diet-plans` | List diet plans for owned cattle. |
| `POST` | `/api/v1/care/vaccinations` | Save a vaccination record. |
| `GET` | `/api/v1/care/cattle/{cattle_id}/vaccinations` | List vaccination records for owned cattle. |
| `GET` | `/api/v1/care/vaccinations/upcoming?days=30` | List vaccinations due soon. |

Prediction uploads accept `image/jpeg`, `image/png`, and `image/webp`, with a
maximum size of 5 MB. The classifier converts images to RGB, resizes to 256,
center-crops to 224, and uses ImageNet normalization before inference.

### Quick API check

Register and log in:

```sh
curl -X POST http://127.0.0.1:8000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"choose-a-strong-password"}'

curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"choose-a-strong-password"}'
```

Export the returned `access_token` as `ACCESS_TOKEN`, then request a
prediction:

```sh
curl -X POST http://127.0.0.1:8000/api/v1/predictions \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F 'file=@data/BLF 2340_1.jpg;type=image/jpeg'
```

The known local image is expected to return `LOCAL` as the top prediction.

## Frontend setup

In a second terminal:

```sh
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` in
`frontend/.env.local`. The backend's default CORS configuration already allows
the local Next.js development origins on ports 3000.

## Tests and code quality

Run backend tests and checks with the appropriate PyTorch extra installed:

```sh
uv run pytest
uv run ruff check src tests alembic
uv run ruff format --check src tests alembic
git diff --check
```

Run the standalone inference reference:

```sh
uv run python scripts/smoke_inference.py 'data/BLF 2340_1.jpg'
```

## Docker: CPU production image

The production Docker image uses Python 3.12 slim and CPU-only PyTorch. It
includes the backend source, model artifacts, Alembic files, `pyproject.toml`,
and `uv.lock`. It does not include CUDA, the frontend, local databases, test
data, or real environment files.

Build the image:

```sh
docker build -t cattle-net:cpu .
```

Run it after applying migrations:

```sh
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e MODEL_DEVICE=cpu \
  -e DATABASE_URL='postgresql+asyncpg://username:password@host:5432/database_name' \
  -e JWT_SECRET_KEY='replace-with-a-long-random-secret' \
  -e CORS_ALLOWED_ORIGINS='https://your-frontend.example.com' \
  cattle-net:cpu
```

The container starts one Uvicorn worker on `0.0.0.0`. It deliberately does not
run migrations at web-process startup.

## Security notes

- Never commit `src/cattle_net/.env` or `frontend/.env.local`.
- Use a random `JWT_SECRET_KEY` of at least 32 bytes in every environment.
- Set explicit production CORS origins.
- Store production database URLs and secrets in the deployment platform's
  secret manager or environment configuration.
- Uploaded images are transient and are not written to disk by the API.

## Current scope

This is a version 1 project. It does not send notifications or provide
veterinary diagnosis. Diet plans and vaccination information are user-recorded
care data, not medical or nutritional advice.
