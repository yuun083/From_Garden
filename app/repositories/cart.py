from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.cart import Cart
from app.schemes.cart import SCartItemGet
from .base import BaseRepository

class CartRepository(BaseRepository[Cart, SCartItemGet]):
    def __init__(self, session):
        super().__init__(session, Cart, SCartItemGet)
    
    async def get_by_user_id(self, user_id: int) -> List[Cart]:
        return await self.get_all(user_id=user_id)
    
    async def get_by_product_id(self, product_id: int) -> List[Cart]:
        return await self.get_all(product_id=product_id)
    
    async def get_user_cart_item(self, user_id: int, product_id: int) -> Optional[Cart]:
        return await self.get_one(user_id=user_id, product_id=product_id)
    
    async def clear_user_cart(self, user_id: int) -> int:
        cart_items = await self.get_by_user_id(user_id)
        count = len(cart_items)
        for item in cart_items:
            await self.delete(item.id)
        return count
    
    async def get_cart_with_products(self, user_id: int) -> List[Cart]:
        query = (
            select(self.model)
            .filter_by(user_id=user_id)
            .options(selectinload(self.model.product))
        )
        result = await self.session.execute(query)
        return result.scalars().all()