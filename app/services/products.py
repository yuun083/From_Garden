from app.services.base import BaseService
from app.exceptions.products import ProductNotFoundError, ProductNotYoursError
from app.schemes.products import SProductAdd, SProductUpdate, SProductPartialUpdate, SProductGet

class ProductService(BaseService):
    def __init__(self, db_manager):
        super().__init__(db_manager)
        self.repository = db_manager.products
        self.farm_repository = db_manager.farms
    
    async def get_products(self) -> list[SProductGet]:
        products = await self.repository.get_all()
        return [SProductGet.model_validate(prod, from_attributes=True) for prod in products]
    
    async def get_product(self, product_id: int) -> SProductGet:
        product = await self.repository.get_one(id=product_id)
        if not product:
            raise ProductNotFoundError
        return SProductGet.model_validate(product, from_attributes=True)
    
    async def create_product(self, product_data: SProductAdd, user_id: int):
        farm = await self.farm_repository.get_farm_by_user_id_with_relations(user_id)
        if not farm:
            user = await self.db.users.get_one_with_role(id=user_id)
            if not user or user.role.name != "admin":
                raise ProductNotYoursError
        
        product_dict = product_data.model_dump()
        if product_dict.get("farm_id") is None and farm:
            product_dict["farm_id"] = farm.id
        
        product = await self.repository.create(product_dict)
        return SProductGet.model_validate(product, from_attributes=True)
    
    async def update_product(self, product_id: int, product_data: SProductUpdate, user_id: int):
        product = await self.repository.get_one_with_role(id=product_id)
        if not product:
            raise ProductNotFoundError
        
        if not await self._check_product_permission(product, user_id):
            raise ProductNotYoursError
        
        updated = await self.repository.update(product_id, product_data.model_dump())
        return SProductGet.model_validate(updated, from_attributes=True)
    
    async def partial_update_product(self, product_id: int, product_data: SProductPartialUpdate, user_id: int):
        product = await self.repository.get_one_with_role(id=product_id)
        if not product:
            raise ProductNotFoundError
        
        if not await self._check_product_permission(product, user_id):
            raise ProductNotYoursError
        
        update_data = product_data.model_dump(exclude_unset=True, exclude_none=True)
        if not update_data:
            return SProductGet.model_validate(product, from_attributes=True)
        
        updated = await self.repository.update(product_id, update_data)
        return SProductGet.model_validate(updated, from_attributes=True)
    
    async def delete_product(self, product_id: int, user_id: int):
        product = await self.repository.get_one_with_role(id=product_id)
        if not product:
            raise ProductNotFoundError
        
        if not await self._check_product_permission(product, user_id):
            raise ProductNotYoursError
        
        await self.repository.delete(product_id)
    
    async def _check_product_permission(self, product, user_id: int) -> bool:
        user = await self.db.users.get_one_with_role(id=user_id)
        
        if not user:
            return False
        
        if user.role.name == "admin":
            return True
        
        if user.role.name == "farmer":
            farm = await self.farm_repository.get_farm_by_user_id(user_id)
            return farm and product.farm_id == farm.id
        
        return False