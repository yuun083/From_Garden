from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.reviews import Review
from app.schemes.reviews import SReviewGet
from .base import BaseRepository

class ReviewRepository(BaseRepository[Review, SReviewGet]):
    def __init__(self, session):
        super().__init__(session, Review, SReviewGet)
    
    async def get_reviews_with_relations(self) -> List[Review]:
        query = (
            select(self.model)
            .options(
                selectinload(self.model.user),
                selectinload(self.model.farm),
                selectinload(self.model.product)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def get_one_with_relations(self, **filter_by) -> Optional[Review]:
        query = (
            select(self.model)
            .filter_by(**filter_by)
            .options(
                selectinload(self.model.user),
                selectinload(self.model.farm),
                selectinload(self.model.product)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().one_or_none()
    
    async def get_reviews_by_user(self, user_id: int) -> List[Review]:
        return await self.get_all(user_id=user_id)
    
    async def get_reviews_by_farm(self, farm_id: int) -> List[Review]:
        return await self.get_all(farm_id=farm_id)
    
    async def get_reviews_by_product(self, product_id: int) -> List[Review]:
        return await self.get_all(product_id=product_id)
    
    async def get_user_product_review(self, user_id: int, product_id: int) -> Optional[Review]:
        return await self.get_one(user_id=user_id, product_id=product_id)
    
    async def get_user_farm_review(self, user_id: int, farm_id: int) -> Optional[Review]:
        return await self.get_one(user_id=user_id, farm_id=farm_id)
    
    async def get_reviews_by_rating(self, rating: int) -> List[Review]:
        return await self.get_all(rating=rating)