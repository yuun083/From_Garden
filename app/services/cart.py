from app.services.base import BaseService
from app.schemes.cart import SCartItemAdd, SCartItemGet

class CartService(BaseService):
    def __init__(self, db_manager):
        super().__init__(db_manager)
        self.repository = db_manager.cart
        self.product_repository = db_manager.products
    
    async def get_cart(self, user_id: int) -> list[SCartItemGet]:
        cart_items = await self.repository.get_by_user_id(user_id)
        return [SCartItemGet.model_validate(item, from_attributes=True) for item in cart_items]
    
    async def add_item(self, user_id: int, cart_item: SCartItemAdd):
        product = await self.product_repository.get_one(id=cart_item.product_id)
        if not product:
            from app.exceptions.cart import CartItemNotFoundHTTPError
            raise CartItemNotFoundHTTPError
        
        existing = await self.repository.get_user_cart_item(user_id=user_id, product_id=cart_item.product_id)
        if existing:
            await self.repository.update(
                existing.id, 
                {"quantity": existing.quantity + cart_item.quantity}
            )
        else:
            cart_item_dict = cart_item.model_dump()
            cart_item_dict["user_id"] = user_id
            await self.repository.create(cart_item_dict)
    
    async def update_item(self, user_id: int, product_id: int, quantity: float):
        cart_item = await self.repository.get_user_cart_item(user_id=user_id, product_id=product_id)
        if not cart_item:
            from app.exceptions.cart import CartItemNotFoundHTTPError
            raise CartItemNotFoundHTTPError
        
        if quantity <= 0:
            await self.repository.delete(cart_item.id)
        else:
            await self.repository.update(cart_item.id, {"quantity": quantity})
    
    async def delete_item(self, user_id: int, product_id: int):
        cart_item = await self.repository.get_user_cart_item(user_id=user_id, product_id=product_id)
        if not cart_item:
            from app.exceptions.cart import CartItemNotFoundHTTPError
            raise CartItemNotFoundHTTPError
        
        await self.repository.delete(cart_item.id)
    
    async def clear_cart(self, user_id: int):
        cart_items = await self.repository.get_by_user_id(user_id)
        for item in cart_items:
            await self.repository.delete(item.id)