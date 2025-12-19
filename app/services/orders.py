from app.services.base import BaseService
from app.exceptions.orders import OrderNotFoundError, OrderNotYoursError, OrderCannotBeCanceledError
from app.schemes.orders import SOrderCreate, SOrderGet, SOrderUpdate

class OrderService(BaseService):
    def __init__(self, db_manager):
        super().__init__(db_manager)
        self.repository = db_manager.orders
        self.cart_repository = db_manager.cart
        self.product_repository = db_manager.products
    
    async def get_user_orders(self, user_id: int) -> list[SOrderGet]:
        orders = await self.repository.get_by_user_id(user_id)
        return [SOrderGet.model_validate(order, from_attributes=True) for order in orders]
    
    async def get_all_orders(self) -> list[SOrderGet]:
        orders = await self.repository.get_all()
        return [SOrderGet.model_validate(order, from_attributes=True) for order in orders]
    
    async def get_order(self, order_id: int, user_id: int) -> SOrderGet:
        order = await self.repository.get_one(id=order_id)
        if not order:
            raise OrderNotFoundError
        
        if order.user_id != user_id:
            user = await self.db.users.get_one_with_role(id=user_id)
            if not user or user.role.name != "admin":
                raise OrderNotYoursError
        
        return SOrderGet.model_validate(order, from_attributes=True)
    
    async def create_order(self, user_id: int, order_data: SOrderCreate):
        order_dict = order_data.model_dump()
        order_dict["user_id"] = user_id
        order_dict["status"] = "pending"
        order_dict["payment_status"] = "pending"
        items_data = order_dict.pop("items", [])
        
        order = await self.repository.create(order_dict)
        for item_data in items_data:
            item_data["order_id"] = order.id
            await self.db.order_items.create(item_data)
        
        return SOrderGet.model_validate(order, from_attributes=True)
    
    async def update_order(self, order_id: int, order_data: SOrderUpdate, user_id: int):
        order = await self.repository.get_one(id=order_id)
        if not order:
            raise OrderNotFoundError
        
        if order.user_id != user_id:
            raise OrderNotYoursError
        
        updated = await self.repository.update(order_id, order_data.model_dump())
        return SOrderGet.model_validate(updated, from_attributes=True)
    
    async def cancel_order(self, order_id: int, user_id: int):
        order = await self.repository.get_one(id=order_id)
        if not order:
            raise OrderNotFoundError
        
        if order.user_id != user_id:
            raise OrderNotYoursError
        
        if order.status not in ["pending", "processing"]:
            raise OrderCannotBeCanceledError
        
        await self.repository.update(order_id, {"status": "cancelled"})
    
    async def update_order_status(self, order_id: int, status: str, user_id: int):
        order = await self.repository.get_one(id=order_id)
        if not order:
            raise OrderNotFoundError
        
        if order.user_id != user_id:
            user = await self.db.users.get_one_with_role(id=user_id)
            if not user or user.role.name != "admin":
                raise OrderNotYoursError
        
        await self.repository.update(order_id, {"status": status})