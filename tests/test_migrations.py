from pathlib import Path

from alembic.config import Config
from sqlalchemy import create_engine, inspect

from alembic import command

PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_initial_migration_upgrades_an_empty_database(tmp_path, monkeypatch):
    database_path = tmp_path / "migration-test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{database_path}")

    alembic_config = Config(str(PROJECT_ROOT / "alembic.ini"))
    command.upgrade(alembic_config, "head")

    engine = create_engine(f"sqlite:///{database_path}")
    inspector = inspect(engine)

    assert set(inspector.get_table_names()) == {
        "alembic_version",
        "cattle",
        "diet_plans",
        "prediction_records",
        "users",
        "vaccination_records",
    }
    assert inspector.get_pk_constraint("users")["constrained_columns"] == ["id"]
    assert inspector.get_unique_constraints("users") == [
        {"name": None, "column_names": ["email"]}
    ]
    assert (
        inspector.get_foreign_keys("prediction_records")[0]["referred_table"] == "users"
    )
    assert inspector.get_foreign_keys("cattle")[0]["referred_table"] == "users"
    assert inspector.get_foreign_keys("diet_plans")[0]["referred_table"] == "cattle"
    assert (
        inspector.get_foreign_keys("vaccination_records")[0]["referred_table"]
        == "cattle"
    )
    assert {index["name"] for index in inspector.get_indexes("prediction_records")} == {
        "ix_prediction_records_user_id"
    }
    assert {index["name"] for index in inspector.get_indexes("cattle")} == {
        "ix_cattle_user_id"
    }
    assert {index["name"] for index in inspector.get_indexes("diet_plans")} == {
        "ix_diet_plans_cattle_id"
    }
    assert {
        index["name"] for index in inspector.get_indexes("vaccination_records")
    } == {
        "ix_vaccination_records_cattle_id",
        "ix_vaccination_records_next_due_on",
    }

    engine.dispose()
