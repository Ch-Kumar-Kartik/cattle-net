"""Initial application schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-08-25
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "prediction_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("model_version", sa.String(length=64), nullable=False),
        sa.Column("predictions", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_prediction_records_user_id"),
        "prediction_records",
        ["user_id"],
        unique=False,
    )
    op.create_table(
        "cattle",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("breed", sa.String(length=120), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cattle_user_id"), "cattle", ["user_id"], unique=False)
    op.create_table(
        "diet_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cattle_id", sa.Integer(), nullable=False),
        sa.Column("fodder_kg_per_day", sa.Float(), nullable=False),
        sa.Column("concentrate_kg_per_day", sa.Float(), nullable=False),
        sa.Column("supplements", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["cattle_id"], ["cattle.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_diet_plans_cattle_id"), "diet_plans", ["cattle_id"], unique=False
    )
    op.create_table(
        "vaccination_records",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("cattle_id", sa.Integer(), nullable=False),
        sa.Column("vaccine_name", sa.String(length=120), nullable=False),
        sa.Column("administered_on", sa.Date(), nullable=False),
        sa.Column("next_due_on", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["cattle_id"], ["cattle.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_vaccination_records_cattle_id"),
        "vaccination_records",
        ["cattle_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_vaccination_records_next_due_on"),
        "vaccination_records",
        ["next_due_on"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_vaccination_records_next_due_on", table_name="vaccination_records"
    )
    op.drop_index("ix_vaccination_records_cattle_id", table_name="vaccination_records")
    op.drop_table("vaccination_records")
    op.drop_index("ix_diet_plans_cattle_id", table_name="diet_plans")
    op.drop_table("diet_plans")
    op.drop_index("ix_cattle_user_id", table_name="cattle")
    op.drop_table("cattle")
    op.drop_index("ix_prediction_records_user_id", table_name="prediction_records")
    op.drop_table("prediction_records")
    op.drop_table("users")
