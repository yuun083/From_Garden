from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.farms import Farm
from app.schemes.farms import SFarmGet
from .base import BaseRepository

class FarmRepository(BaseRepository[Farm, SFarmGet]):
    def __init__(self, session):
        super().__init__(session, Farm, SFarmGet)
    
    async def get_by_user_id(self, user_id: int) -> List[Farm]:
        return await self.get_all(user_id=user_id)
    
    async def get_farm_by_user_id(self, user_id: int) -> Optional[Farm]:
        return await self.get_one(user_id=user_id)
    
    async def get_farm_by_user_id_with_relations(self, user_id: int) -> Optional[Farm]:
        query = (
            select(self.model)
            .filter_by(user_id=user_id)
            .options(selectinload(self.model.user))
        )
        result = await self.session.execute(query)
        return result.scalars().one_or_none()
    
    async def get_pending_applications(self) -> List[Farm]:
        return await self.get_all(status="pending")
    
    async def get_pending_application_by_user(self, user_id: int) -> Optional[Farm]:
        return await self.get_one(user_id=user_id, status="pending")
    
    async def get_farm_with_relations(self, farm_id: int) -> Optional[Farm]:
        query = (
            select(self.model)
            .filter_by(id=farm_id)
            .options(
                selectinload(self.model.user),
                selectinload(self.model.products),
                selectinload(self.model.orders),
                selectinload(self.model.reviews)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().one_or_none()