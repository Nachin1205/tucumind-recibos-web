"""Add receipt number sequence and uniqueness

Revision ID: 2f4a8f4d7c2d
Revises: 9d4365386b8c
Create Date: 2026-03-12 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "2f4a8f4d7c2d"
down_revision: Union[str, None] = "9d4365386b8c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START WITH 1 INCREMENT BY 1")
    op.execute(
        """
        SELECT setval(
            'receipt_number_seq',
            COALESCE((SELECT MAX(receipt_number) FROM receipts), 0) + 1,
            false
        )
        """
    )
    op.execute("ALTER TABLE receipts ALTER COLUMN receipt_number SET DEFAULT nextval('receipt_number_seq')")
    op.drop_index("ix_receipts_receipt_number", table_name="receipts")
    op.create_unique_constraint("uq_receipts_receipt_number", "receipts", ["receipt_number"])


def downgrade() -> None:
    op.drop_constraint("uq_receipts_receipt_number", "receipts", type_="unique")
    op.create_index("ix_receipts_receipt_number", "receipts", ["receipt_number"], unique=False)
    op.execute("ALTER TABLE receipts ALTER COLUMN receipt_number DROP DEFAULT")
    op.execute("DROP SEQUENCE IF EXISTS receipt_number_seq")
