from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base

if TYPE_CHECKING:
    from .roles import Role
    from .farms import Farm
    from .cart import Cart
    from .orders import Order
    from .reviews import Review
    from .user_subscriptions import UserSubscription

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False, default=2)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    address: Mapped[Optional[str]] = mapped_column(String(500))
    card: Mapped[Optional[int]] = mapped_column(Integer)
    
    role: Mapped["Role"] = relationship(back_populates="users")
    farm: Mapped[Optional["Farm"]] = relationship(back_populates="user")
    cart_items: Mapped[list["Cart"]] = relationship(back_populates="user")
    orders: Mapped[list["Order"]] = relationship(back_populates="user")
    reviews: Mapped[list["Review"]] = relationship(back_populates="user")
    subscriptions: Mapped[list["UserSubscription"]] = relationship(back_populates="user")