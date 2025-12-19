from fastapi import APIRouter

from app.api.dependencies import DBDep, CurrentUserDep, IsAdminDep
from app.exceptions.orders import (
    OrderNotFoundError,
    OrderNotFoundHTTPError,
    OrderNotYoursError,
    OrderNotYoursHTTPError,
    OrderCannotBeCanceledError,
    OrderCannotBeCanceledHTTPError,
)
from app.schemes.orders import SOrderCreate, SOrderGet, SOrderUpdate
from app.services.orders import OrderService

router = APIRouter(prefix="/orders", tags=["Заказы"])

@router.get("", summary="Получение списка заказов пользователя")
async def get_user_orders(
    db: DBDep,
    current_user: CurrentUserDep,
) -> list[SOrderGet]:
    return await OrderService(db).get_user_orders(user_id=current_user.id)

@router.get("/all", summary="Получение всех заказов (только для админов)")
async def get_all_orders(
    db: DBDep,
    is_admin: IsAdminDep,
) -> list[SOrderGet]:
    return await OrderService(db).get_all_orders()

@router.get("/{order_id}", summary="Получение конкретного заказа")
async def get_order(
    order_id: int,
    db: DBDep,
    current_user: CurrentUserDep,
) -> SOrderGet:
    try:
        return await OrderService(db).get_order(order_id=order_id, user_id=current_user.id)
    except OrderNotFoundError:
        raise OrderNotFoundHTTPError
    except OrderNotYoursError:
        raise OrderNotYoursHTTPError

@router.post("", summary="Создание нового заказа")
async def create_order(
    order_data: SOrderCreate,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    await OrderService(db).create_order(user_id=current_user.id, order_data=order_data)
    return {"status": "OK"}

@router.put("/{order_id}", summary="Полное изменение заказа")
async def update_order(
    order_id: int,
    order_data: SOrderUpdate,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await OrderService(db).update_order(order_id=order_id, order_data=order_data, user_id=current_user.id)
    except OrderNotFoundError:
        raise OrderNotFoundHTTPError
    except OrderNotYoursError:
        raise OrderNotYoursHTTPError
    return {"status": "OK"}

@router.patch("/{order_id}/cancel", summary="Отмена заказа")
async def cancel_order(
    order_id: int,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await OrderService(db).cancel_order(order_id=order_id, user_id=current_user.id)
    except OrderNotFoundError:
        raise OrderNotFoundHTTPError
    except OrderNotYoursError:
        raise OrderNotYoursHTTPError
    except OrderCannotBeCanceledError:
        raise OrderCannotBeCanceledHTTPError
    return {"status": "OK"}

@router.patch("/{order_id}/status", summary="Изменение статуса заказа (админы/автоматически)")
async def update_order_status(
    order_id: int,
    status: str,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await OrderService(db).update_order_status(order_id=order_id, status=status, user_id=current_user.id)
    except OrderNotFoundError:
        raise OrderNotFoundHTTPError
    except OrderNotYoursError:
        raise OrderNotYoursHTTPError
    return {"status": "OK"}