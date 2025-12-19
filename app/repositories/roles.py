from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.roles import Role
from app.schemes.roles import SRoleGet, SRoleGetWithRels
from .base import BaseRepository

class RolesRepository(BaseRepository[Role, SRoleGet]):
    def __init__(self, session):
        super().__init__(session, Role, SRoleGet)

    async def get_one_with_users(self, id: int) -> Optional[SRoleGetWithRels]:
        query = (
            select(self.model)
            .filter_by(id=id)
            .options(selectinload(self.model.users))
        )
        result = await self.session.execute(query)
        role = result.scalars().one_or_none()
        
        if role:
            return SRoleGetWithRels.model_validate(role, from_attributes=True)
        return None
    
    async def get_one_or_none_with_users(self, **filter_by) -> Optional[SRoleGetWithRels]:
        query = (
            select(self.model)
            .filter_by(**filter_by)
            .options(selectinload(self.model.users))
        )
        result = await self.session.execute(query)
        model = result.scalars().one_or_none()
        
        if model is None:
            return None
        
        return SRoleGetWithRels.model_validate(model, from_attributes=True)