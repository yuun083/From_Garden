from app.services.base import BaseService
from app.exceptions.roles import RoleNotFoundError, RoleAlreadyExistsError
from app.schemes.roles import SRoleAdd, SRoleGet, SRoleGetWithRels

class RoleService(BaseService):
    def __init__(self, db_manager):
        super().__init__(db_manager)
        self.repository = db_manager.roles
    
    async def get_roles(self) -> list[SRoleGet]:
        roles = await self.repository.get_all()
        return [SRoleGet.model_validate(role, from_attributes=True) for role in roles]
    
    async def get_role(self, role_id: int) -> SRoleGetWithRels:
        role = await self.repository.get_one_with_users(role_id)
        if not role:
            raise RoleNotFoundError
        return SRoleGetWithRels.model_validate(role, from_attributes=True)
    
    async def create_role(self, role_data: SRoleAdd):
        existing = await self.repository.get_one(name=role_data.name)
        if existing:
            raise RoleAlreadyExistsError
        
        role = await self.repository.create(role_data.model_dump())
        return SRoleGet.model_validate(role, from_attributes=True)
    
    async def edit_role(self, role_id: int, role_data: SRoleAdd):
        role = await self.repository.get_one(id=role_id)
        if not role:
            raise RoleNotFoundError
        
        if role_data.name != role.name:
            existing = await self.repository.get_one(name=role_data.name)
            if existing:
                raise RoleAlreadyExistsError
        
        updated = await self.repository.update(role_id, role_data.model_dump())
        return SRoleGet.model_validate(updated, from_attributes=True)
    
    async def delete_role(self, role_id: int):
        role = await self.repository.get_one(id=role_id)
        if not role:
            raise RoleNotFoundError
        
        await self.repository.delete(role_id)