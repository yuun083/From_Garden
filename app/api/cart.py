from fastapi import APIRouter

from app.api.dependencies import DBDep, CurrentUserDep
from app.exceptions.cart import (
    CartItemNotFoundError,
    CartItemNotFoundHTTPError,
    CartItemAlreadyExistsError,
    CartItemAlreadyExistsHTTPError,
)
from app.schemes.cart import SCartItemAdd, SCartItemGet
from app.services.cart import CartService

router = APIRouter(prefix="/cart", tags=["Корзина"])

@router.get("", summary="Получение корзины пользователя")
async def get_cart(
    db: DBDep,
    current_user: CurrentUserDep,
) -> list[SCartItemGet]:
    return await CartService(db).get_cart(user_id=current_user.id)

@router.post("/items", summary="Добавление товара в корзину")
async def add_to_cart(
    cart_item: SCartItemAdd,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await CartService(db).add_item(user_id=current_user.id, cart_item=cart_item)
    except CartItemAlreadyExistsError:
        raise CartItemAlreadyExistsHTTPError
    return {"status": "OK"}

@router.put("/items/{product_id}", summary="Изменение количества товара в корзине")
async def update_cart_item(
    product_id: int,
    quantity: float,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await CartService(db).update_item(user_id=current_user.id, product_id=product_id, quantity=quantity)
    except CartItemNotFoundError:
        raise CartItemNotFoundHTTPError
    return {"status": "OK"}

@router.delete("/items/{product_id}", summary="Удаление товара из корзины")
async def delete_cart_item(
    product_id: int,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await CartService(db).delete_item(user_id=current_user.id, product_id=product_id)
    except CartItemNotFoundError:
        raise CartItemNotFoundHTTPError
    return {"status": "OK"}