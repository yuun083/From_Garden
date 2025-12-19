from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.products import Product
from app.schemes.products import SProductGet
from .base import BaseRepository

class ProductRepository(BaseRepository[Product, SProductGet]):
    def __init__(self, session):
        super().__init__(session, Product, SProductGet)
    
    async def get_products_with_relations(self) -> List[Product]:
        query = (
            select(self.model)
            .options(
                selectinload(self.model.category),
                selectinload(self.model.farm),
                selectinload(self.model.cart_items),
                selectinload(self.model.order_items),
                selectinload(self.model.reviews)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_one_with_relations(self, **filter_by) -> Optional[Product]:
        query = (
            select(self.model)
            .filter_by(**filter_by)
            .options(
                selectinload(self.model.category),
                selectinload(self.model.farm),
                selectinload(self.model.cart_items),
                selectinload(self.model.order_items),
                selectinload(self.model.reviews)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().one_or_none()
    
    async def get_by_farm_id(self, farm_id: int) -> List[Product]:
        return await self.get_all(farm_id=farm_id)
    
    async def get_by_category_id(self, category_id: int) -> List[Product]:
        return await self.get_all(category_id=category_id)
    
    async def get_in_stock_products(self) -> List[Product]:
        return await self.get_all(in_stock=True)