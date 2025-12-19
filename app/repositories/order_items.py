from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.order_items import OrderItem
from app.schemes.order_items import SOrderItemGet
from .base import BaseRepository

class OrderItemRepository(BaseRepository[OrderItem, SOrderItemGet]):
    def __init__(self, session):
        super().__init__(session, OrderItem, SOrderItemGet)
    
    async def get_by_order_id(self, order_id: int) -> List[OrderItem]:
        return await self.get_all(order_id=order_id)
    
    async def get_by_product_id(self, product_id: int) -> List[OrderItem]:
        return await self.get_all(product_id=product_id)
    
    async def get_item_with_product(self, item_id: int) -> Optional[OrderItem]:
        query = (
            select(self.model)
            .filter_by(id=item_id)
            .options(selectinload(self.model.product))
        )
        result = await self.session.execute(query)
        return result.scalars().one_or_none()