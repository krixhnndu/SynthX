"""version history, comments, assignments

Revision ID: 2c8e91a47b6d
Revises: 99b57f701a08
Create Date: 2026-08-08 10:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '2c8e91a47b6d'
down_revision = '99b57f701a08'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('case_versions',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('case_id', sa.String(length=36), nullable=False),
    sa.Column('version', sa.Integer(), nullable=False),
    sa.Column('payload', sa.JSON(), nullable=False),
    sa.Column('created_by', sa.String(length=200), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['case_id'], ['contract_cases.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('case_id', 'version', name='uq_case_version')
    )
    with op.batch_alter_table('case_versions', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_case_versions_case_id'), ['case_id'], unique=False)

    op.create_table('case_comments',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('case_id', sa.String(length=36), nullable=False),
    sa.Column('author_id', sa.String(length=36), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['case_id'], ['contract_cases.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('case_comments', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_case_comments_case_id'), ['case_id'], unique=False)

    op.create_table('case_assignees',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('case_id', sa.String(length=36), nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('assigned_by', sa.String(length=200), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['case_id'], ['contract_cases.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('case_id', 'user_id', name='uq_case_assignee')
    )
    with op.batch_alter_table('case_assignees', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_case_assignees_case_id'), ['case_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('case_assignees', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_case_assignees_case_id'))

    op.drop_table('case_assignees')
    with op.batch_alter_table('case_comments', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_case_comments_case_id'))

    op.drop_table('case_comments')
    with op.batch_alter_table('case_versions', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_case_versions_case_id'))

    op.drop_table('case_versions')
