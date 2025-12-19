from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database.database import Base

if TYPE_CHECKING:
    from .users import User
    from .farms import Farm
    from .order_items import OrderItem

class Order(Base):
    __tablename__ = "orders"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    farm_id: Mapped[int] = mapped_column(ForeignKey("farms.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    order_date: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    delivery_address: Mapped[str] = mapped_column(String(500), nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    
    user: Mapped["User"] = relationship(back_populates="orders")
    farm: Mapped["Farm"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")