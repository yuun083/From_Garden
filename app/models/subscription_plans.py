from typing import TYPE_CHECKING
from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base

if TYPE_CHECKING:
    from .user_subscriptions import UserSubscription

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)  # НЕ price_per_month
    delivery_frequency: Mapped[str] = mapped_column(String(50), nullable=False, default="weekly")
    
    user_subscriptions: Mapped[list["UserSubscription"]] = relationship(back_populates="plan")