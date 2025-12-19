from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import TIMESTAMP, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base

if TYPE_CHECKING:
    from .users import User
    from .farms import Farm
    from .products import Product

class Review(Base):
    __tablename__ = "reviews"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    farm_id: Mapped[Optional[int]] = mapped_column(ForeignKey("farms.id"))
    product_id: Mapped[Optional[int]] = mapped_column(ForeignKey("products.id"))
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMP, default=datetime.utcnow)
    
    user: Mapped["User"] = relationship(back_populates="reviews")
    farm: Mapped[Optional["Farm"]] = relationship(back_populates="reviews")
    product: Mapped[Optional["Product"]] = relationship(back_populates="reviews")