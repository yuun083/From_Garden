from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.exceptions.users import UserNotFoundError
from app.models.users import User
from app.schemes.users import SUserGet, UserProfile
from .base import BaseRepository

class UsersRepository(BaseRepository[User, SUserGet]):
    def __init__(self, session):
        super().__init__(session, User, SUserGet)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        return await self.get_one(email=email)
    
    async def get_by_username(self, username: str) -> Optional[User]:
        return await self.get_one(username=username)
    
    async def create_one(self, data: dict) -> User:
        return await self.create(data)
    
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        return await self.get_one(id=user_id)
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        return await self.get_one(id=user_id)
    
    async def update_user(self, user_id: int, update_data: dict) -> User:
        from app.exceptions.users import UserNotFoundError
        user = await self.get_one_or_raise(id=user_id)
        
        for key, value in update_data.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        
        await self.session.commit()
        await self.session.refresh(user)
        return user
    
    async def get_one_with_role(self, **filter_by) -> Optional[User]:
        query = (
            select(self.model)
            .filter_by(**filter_by)
            .options(selectinload(self.model.role))
        )
        result = await self.session.execute(query)
        return result.scalars().one_or_none()
    
    async def get_users_with_relations(self) -> List[User]:
        query = (
            select(self.model)
            .options(
                selectinload(self.model.role),
                selectinload(self.model.farm),
                selectinload(self.model.cart_items),
                selectinload(self.model.orders),
                selectinload(self.model.reviews),
                selectinload(self.model.subscriptions)
            )
        )
        result = await self.session.execute(query)
        return result.scalars().all()