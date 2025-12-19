from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base

if TYPE_CHECKING:
    from .users import User
    from .products import Product
    from .orders import Order
    from .reviews import Review

class Farm(Base):
    __tablename__ = "farms"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255))
    contact_phone: Mapped[Optional[str]] = mapped_column(String(20))
    image: Mapped[Optional[bytes]] = mapped_column()
    rating_avg: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="active")
    
    user: Mapped["User"] = relationship(back_populates="farm")
    products: Mapped[list["Product"]] = relationship(back_populates="farm")
    orders: Mapped[list["Order"]] = relationship(back_populates="farm")
    reviews: Mapped[list["Review"]] = relationship(back_populates="farm")