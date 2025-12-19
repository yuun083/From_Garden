from app.services.base import BaseService
from app.exceptions.farms import FarmNotFoundError, FarmAlreadyExistsError, FarmApplicationNotFoundError
from app.schemes.farms import SFarmAdd, SFarmGet, SFarmApplicationResponse

class FarmService(BaseService):
    def __init__(self, db_manager):
        super().__init__(db_manager)
        self.repository = db_manager.farms
        self.user_repository = db_manager.users
    
    async def get_farms(self) -> list[SFarmGet]:
        farms = await self.repository.get_all()
        return [SFarmGet.model_validate(farm, from_attributes=True) for farm in farms]
    
    async def create_application(self, user_id: int, farm_data: SFarmAdd):
        existing_farm = await self.repository.get_farm_by_user_id(user_id)
        if existing_farm:
            raise FarmAlreadyExistsError
        
        existing_app = await self.repository.get_pending_application_by_user(user_id)
        if existing_app:
            raise FarmAlreadyExistsError
        
        farm_dict = farm_data.model_dump()
        farm_dict["user_id"] = user_id
        farm_dict["status"] = "pending" 
        
        farm = await self.repository.create(farm_dict)
        return farm
    
    async def get_applications(self) -> list[SFarmApplicationResponse]:
        applications = await self.repository.get_pending_applications()
        return [SFarmApplicationResponse.model_validate(app, from_attributes=True) for app in applications]
    
    async def approve_application(self, application_id: int):
        application = await self.repository.get_one(id=application_id)
        if not application:
            raise FarmApplicationNotFoundError
        
        await self.repository.update(application_id, {"status": "approved"})
    
    async def reject_application(self, application_id: int):
        application = await self.repository.get_one(id=application_id)
        if not application:
            raise FarmApplicationNotFoundError
        
        await self.repository.update(application_id, {"status": "rejected"})
    
    async def update_farm(self, farm_id: int, farm_data: SFarmAdd, user_id: int):
        farm = await self.repository.get_one(id=farm_id)
        if not farm:
            raise FarmNotFoundError
        
        if farm.user_id != user_id:
            user = await self.user_repository.get_one(id=user_id)
            if not user or user.role.name != "admin":
                raise FarmNotFoundError
        
        updated = await self.repository.update(farm_id, farm_data.model_dump())
        return SFarmGet.model_validate(updated, from_attributes=True)
    
    async def delete_farm(self, farm_id: int, user_id: int):
        farm = await self.repository.get_one(id=farm_id)
        if not farm:
            raise FarmNotFoundError
        
        if farm.user_id != user_id:
            user = await self.user_repository.get_one(id=user_id)
            if not user or user.role.name != "admin":
                raise FarmNotFoundError
        
        await self.repository.delete(farm_id)
        await self.db.commit()