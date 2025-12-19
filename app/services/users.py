from app.services.base import BaseService
from app.exceptions.auth import UserNotFoundError
from app.schemes.users import SUserGet, SUserUpdate

class UserService(BaseService):
    def __init__(self, db_manager):
        super().__init__(db_manager)
        self.repository = db_manager.users
    
    async def get_users(self) -> list[SUserGet]:
        users = await self.repository.get_all()
        return [SUserGet.model_validate(user, from_attributes=True) for user in users]
    
    async def get_user(self, user_id: int) -> SUserGet:
        user = await self.repository.get_one(id=user_id)
        if not user:
            raise UserNotFoundError
        return SUserGet.model_validate(user, from_attributes=True)
    
    async def update_user(self, user_id: int, user_data: SUserUpdate):
        user = await self.repository.get_one(id=user_id)
        if not user:
            raise UserNotFoundError
        
        updated = await self.repository.update(id=user_id, data=user_data.model_dump(exclude_unset=True))
        return SUserGet.model_validate(updated, from_attributes=True)
    
    async def delete_user(self, user_id: int):
        user = await self.repository.get_one(id=user_id)
        if not user:
            raise UserNotFoundError
        
        await self.repository.delete(user_id)