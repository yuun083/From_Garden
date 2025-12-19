from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.categories import Category
from app.schemes.categories import SCategoryGet
from .base import BaseRepository

class CategoryRepository(BaseRepository[Category, SCategoryGet]):
    def __init__(self, session):
        super().__init__(session, Category, SCategoryGet)
    
    async def get_category_by_name(self, name: str) -> Optional[Category]:
        return await self.get_one(name=name)
    
    async def get_categories_with_products(self) -> List[Category]:
        query = select(self.model).options(selectinload(self.model.products))
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_one_with_products(self, **filter_by) -> Optional[Category]:
        query = (
            select(self.model)
            .filter_by(**filter_by)
            .options(selectinload(self.model.products))
        )
        result = await self.session.execute(query)
        return result.scalars().one_or_none()