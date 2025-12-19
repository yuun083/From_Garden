from fastapi import APIRouter

from app.api.dependencies import DBDep, CurrentUserDep
from app.exceptions.order_items import (
    OrderItemNotFoundError,
    OrderItemNotFoundHTTPError,
    OrderItemAlreadyExistsError,
    OrderItemAlreadyExistsHTTPError,
    OrderItemNotInOrderError,
    OrderItemNotInOrderHTTPError,
    OrderItemNotYoursError,
    OrderItemNotYoursHTTPError,
)
from app.schemes.order_items import SOrderItemGet, SOrderItemCreate, SOrderItemUpdate
from app.services.order_items import OrderItemService

router = APIRouter(prefix="/orders/{order_id}/items", tags=["Элементы заказа"])

@router.get("", summary="Получение элементов заказа")
async def get_order_items(
    order_id: int,
    db: DBDep,
    current_user: CurrentUserDep,
) -> list[SOrderItemGet]:
    try:
        return await OrderItemService(db).get_order_items(order_id=order_id, user_id=current_user.id)
    except OrderItemNotYoursError:
        raise OrderItemNotYoursHTTPError

@router.get("/{item_id}", summary="Получение конкретного элемента заказа")
async def get_order_item(
    order_id: int,
    item_id: int,
    db: DBDep,
    current_user: CurrentUserDep,
) -> SOrderItemGet:
    try:
        return await OrderItemService(db).get_order_item(
            order_id=order_id,
            item_id=item_id,
            user_id=current_user.id
        )
    except OrderItemNotFoundError:
        raise OrderItemNotFoundHTTPError
    except OrderItemNotYoursError:
        raise OrderItemNotYoursHTTPError
    except OrderItemNotInOrderError:
        raise OrderItemNotInOrderHTTPError

@router.post("", summary="Добавление элемента в заказ")
async def add_order_item(
    order_id: int,
    item_data: SOrderItemCreate,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await OrderItemService(db).add_order_item(
            order_id=order_id,
            item_data=item_data,
            user_id=current_user.id
        )
    except OrderItemNotYoursError:
        raise OrderItemNotYoursHTTPError
    except OrderItemAlreadyExistsError:
        raise OrderItemAlreadyExistsHTTPError
    return {"status": "OK"}

@router.put("/{item_id}", summary="Изменение элемента заказа")
async def update_order_item(
    order_id: int,
    item_id: int,
    item_data: SOrderItemUpdate,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await OrderItemService(db).update_order_item(
            order_id=order_id,
            item_id=item_id,
            item_data=item_data,
            user_id=current_user.id
        )
    except OrderItemNotFoundError:
        raise OrderItemNotFoundHTTPError
    except OrderItemNotYoursError:
        raise OrderItemNotYoursHTTPError
    except OrderItemNotInOrderError:
        raise OrderItemNotInOrderHTTPError
    return {"status": "OK"}

@router.delete("/{item_id}", summary="Удаление элемента заказа")
async def delete_order_item(
    order_id: int,
    item_id: int,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await OrderItemService(db).delete_order_item(
            order_id=order_id,
            item_id=item_id,
            user_id=current_user.id
        )
    except OrderItemNotFoundError:
        raise OrderItemNotFoundHTTPError
    except OrderItemNotYoursError:
        raise OrderItemNotYoursHTTPError
    except OrderItemNotInOrderError:
        raise OrderItemNotInOrderHTTPError
    return {"status": "OK"}