"""legal knowledge vector metadata

Revision ID: 6b40f7de5b4f
Revises: 2c8e91a47b6d
Create Date: 2026-08-08 02:45:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = '6b40f7de5b4f'
down_revision = '2c8e91a47b6d'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('legal_knowledge_documents', schema=None) as batch_op:
        batch_op.add_column(sa.Column('vector_store', sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column('vector_collection', sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column('embedding_model', sa.String(length=256), nullable=True))
        batch_op.add_column(sa.Column('embedding_dimensions', sa.Integer(), nullable=True))

    op.execute("UPDATE legal_knowledge_documents SET vector_store = 'chroma' WHERE vector_store IS NULL")
    op.execute("UPDATE legal_knowledge_documents SET vector_collection = 'legal_knowledge' WHERE vector_collection IS NULL")


def downgrade() -> None:
    with op.batch_alter_table('legal_knowledge_documents', schema=None) as batch_op:
        batch_op.drop_column('embedding_dimensions')
        batch_op.drop_column('embedding_model')
        batch_op.drop_column('vector_collection')
        batch_op.drop_column('vector_store')
