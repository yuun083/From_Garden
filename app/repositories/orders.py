from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.orders import Order
from app.schemes.orders import SOrderGet
from .base import BaseRepository

class OrderRepository(BaseRepository[Order, SOrderGet]):
    def __init__(self, session):
        super().__init__(session, Order, SOrderGet)
    
    async def get_by_user_id(self, user_id: int) -> List[Order]:
        return await self.get_all(user_id=user_id)
    
    async def get_by_status(self, status: str) -> List[Order]:
        return await self.get_all(status=status)
    
    async def get_user_order(self, user_id: int, order_id: int) -> Optional[Order]:
        return await self.get_one(id=order_id, user_id=user_id)
    
    async def get_order_with_items(self, order_id: int) -> Optional[Order]:
        query = (
            select(self.model)
            .filter_by(id=order_id)
            .options(
                selectinload(self.model.user),
                selectinload(self.model.farm),
                selectinload(self.model.items).selectinload(self.model.items.product)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().one_or_none()