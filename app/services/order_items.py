from app.services.base import BaseService
from app.exceptions.order_items import OrderItemNotFoundError, OrderItemNotInOrderError, OrderItemNotYoursError
from app.schemes.order_items import SOrderItemGet, SOrderItemCreate, SOrderItemUpdate

class OrderItemService(BaseService):
    def __init__(self, db_manager):
        super().__init__(db_manager)
        self.repository = db_manager.order_items
        self.order_repository = db_manager.orders
    
    async def get_order_items(self, order_id: int, user_id: int) -> list[SOrderItemGet]:
        order = await self.order_repository.get_one(id=order_id)
        if not order or order.user_id != user_id:
            user = await self.db.users.get_one(id=user_id)
            if not user or user.role.name != "admin":
                raise OrderItemNotYoursError
        
        items = await self.repository.get_by_order_id(order_id)
        return [SOrderItemGet.model_validate(item, from_attributes=True) for item in items]
    
    async def get_order_item(self, order_id: int, item_id: int, user_id: int) -> SOrderItemGet:
        item = await self.repository.get_one(id=item_id)
        if not item:
            raise OrderItemNotFoundError
        
        if item.order_id != order_id:
            raise OrderItemNotInOrderError
        
        order = await self.order_repository.get_one(id=order_id)
        if not order or order.user_id != user_id:
            user = await self.db.users.get_one(id=user_id)
            if not user or user.role.name != "admin":
                raise OrderItemNotYoursError
        
        return SOrderItemGet.model_validate(item, from_attributes=True)
    
    async def add_order_item(self, order_id: int, item_data: SOrderItemCreate, user_id: int):
        order = await self.order_repository.get_one(id=order_id)
        if not order or order.user_id != user_id:
            user = await self.db.users.get_one(id=user_id)
            if not user or user.role.name != "admin":
                raise OrderItemNotYoursError
        
        item_dict = item_data.model_dump()
        item_dict["order_id"] = order_id
        item = await self.repository.create(item_dict)
        return SOrderItemGet.model_validate(item, from_attributes=True)
    
    async def update_order_item(self, order_id: int, item_id: int, item_data: SOrderItemUpdate, user_id: int):
        item = await self.repository.get_one(id=item_id)
        if not item:
            raise OrderItemNotFoundError
        
        if item.order_id != order_id:
            raise OrderItemNotInOrderError
        
        order = await self.order_repository.get_one(id=order_id)
        if not order or order.user_id != user_id:
            user = await self.db.users.get_one(id=user_id)
            if not user or user.role.name != "admin":
                raise OrderItemNotYoursError
        
        updated = await self.repository.update(item_id, item_data.model_dump())
        return SOrderItemGet.model_validate(updated, from_attributes=True)
    
    async def delete_order_item(self, order_id: int, item_id: int, user_id: int):
        item = await self.repository.get_one(id=item_id)
        if not item:
            raise OrderItemNotFoundError
        
        if item.order_id != order_id:
            raise OrderItemNotInOrderError
        
        order = await self.order_repository.get_one(id=order_id)
        if not order or order.user_id != user_id:
            user = await self.db.users.get_one(id=user_id)
            if not user or user.role.name != "admin":
                raise OrderItemNotYoursError
        
        await self.repository.delete(item_id)