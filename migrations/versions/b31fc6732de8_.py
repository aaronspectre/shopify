"""empty message

Revision ID: b31fc6732de8
Revises: cecb28c81bfe
Create Date: 2023-11-11 11:22:47.076775

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b31fc6732de8'
down_revision: Union[str, None] = 'cecb28c81bfe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('messages', sa.Column('href', sa.Boolean(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('messages', 'href')
    # ### end Alembic commands ###
