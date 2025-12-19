from app.services.base import BaseService
from app.exceptions.categories import CategoryNotFoundError, CategoryAlreadyExistsError
from app.schemes.categories import SCategoryAdd, SCategoryGet

class CategoryService(BaseService):
    def __init__(self, db_manager):
        super().__init__(db_manager)
        self.repository = db_manager.categories
    
    async def get_categories(self) -> list[SCategoryGet]:
        categories = await self.repository.get_all()
        return [SCategoryGet.model_validate(cat, from_attributes=True) for cat in categories]
    
    async def create_category(self, category_data: SCategoryAdd):
        existing = await self.repository.get_category_by_name(category_data.name)
        if existing:
            raise CategoryAlreadyExistsError
        
        category = await self.repository.create(category_data.model_dump())
        return SCategoryGet.model_validate(category, from_attributes=True)
    
    async def update_category(self, category_id: int, category_data: SCategoryAdd):
        category = await self.repository.get_one(id=category_id)
        if not category:
            raise CategoryNotFoundError
        
        if category_data.name != category.name:
            existing = await self.repository.get_category_by_name(category_data.name)
            if existing:
                raise CategoryAlreadyExistsError
        
        updated = await self.repository.update(category_id, category_data.model_dump())
        return SCategoryGet.model_validate(updated, from_attributes=True)
    
    async def delete_category(self, category_id: int):
        category = await self.repository.get_one(id=category_id)
        if not category:
            raise CategoryNotFoundError
        
        await self.repository.delete(category_id)