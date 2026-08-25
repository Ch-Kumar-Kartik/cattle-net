"""Alembic migration environment for the async SQLAlchemy database."""

import asyncio
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import create_engine, pool
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT / "src"))

from cattle_net.config import Settings
from cattle_net.models import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def get_database_url() -> str:
    """Read the URL without ConfigParser interpolation of password characters."""
    return Settings().database_url


def get_migration_database_url() -> str:
    """Use SQLite synchronously for migrations while preserving async PostgreSQL."""
    database_url = get_database_url()
    url = make_url(database_url)

    if url.drivername == "sqlite+aiosqlite":
        return str(url.set(drivername="sqlite"))

    return database_url


def run_migrations_offline() -> None:
    """Run migrations without creating a database connection."""
    context.configure(
        url=get_migration_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    """Configure Alembic with an active synchronous connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Create an async engine solely for migration execution."""
    connectable = create_async_engine(
        get_migration_database_url(), poolclass=pool.NullPool
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations against the configured database URL."""
    database_url = get_migration_database_url()

    if make_url(database_url).drivername == "postgresql+asyncpg":
        asyncio.run(run_async_migrations())
        return

    connectable = create_engine(database_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        do_run_migrations(connection)
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
