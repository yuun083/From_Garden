from fastapi import APIRouter

from app.api.dependencies import DBDep, CurrentUserDep, IsFarmerOrAdminDep
from app.exceptions.products import (
    ProductNotFoundError,
    ProductNotFoundHTTPError,
    ProductNotInStockError,
    ProductNotInStockHTTPError,
    ProductNotYoursError,
    ProductNotYoursHTTPError,
)
from app.schemes.products import SProductAdd, SProductUpdate, SProductGet, SProductPartialUpdate
from app.services.products import ProductService

router = APIRouter(prefix="/products", tags=["Товары"])

@router.get("", summary="Получение списка товаров")
async def get_all_products(
    db: DBDep,
) -> list[SProductGet]:
    return await ProductService(db).get_products()

@router.get("/{id}", summary="Получение конкретного товара")
async def get_product(
    id: int,
    db: DBDep,
) -> SProductGet:
    try:
        return await ProductService(db).get_product(product_id=id)
    except ProductNotFoundError:
        raise ProductNotFoundHTTPError

@router.post("", summary="Создание нового товара")
async def create_product(
    product_data: SProductAdd,
    db: DBDep,
    user: IsFarmerOrAdminDep,
) -> dict[str, str]:
    await ProductService(db).create_product(product_data=product_data, user_id=user)
    return {"status": "OK"}

@router.put("/{id}", summary="Полное изменение товара")
async def update_product(
    id: int,
    product_data: SProductUpdate,
    db: DBDep,
    user: IsFarmerOrAdminDep,
) -> dict[str, str]:
    try:
        await ProductService(db).update_product(product_id=id, product_data=product_data, user_id=user)
    except ProductNotFoundError:
        raise ProductNotFoundHTTPError
    except ProductNotYoursError:
        raise ProductNotYoursHTTPError
    return {"status": "OK"}

@router.patch("/{id}", summary="Частичное изменение товара")
async def partial_update_product(
    id: int,
    product_data: SProductPartialUpdate,
    db: DBDep,
    user: IsFarmerOrAdminDep,
) -> dict[str, str]:
    try:
        await ProductService(db).partial_update_product(product_id=id, product_data=product_data, user_id=user)
    except ProductNotFoundError:
        raise ProductNotFoundHTTPError
    except ProductNotYoursError:
        raise ProductNotYoursHTTPError
    return {"status": "OK"}

@router.delete("/{id}", summary="Удаление товара")
async def delete_product(
    id: int,
    db: DBDep,
    user: IsFarmerOrAdminDep,
) -> dict[str, str]:
    try:
        await ProductService(db).delete_product(product_id=id, user_id=user)
    except ProductNotFoundError:
        raise ProductNotFoundHTTPError
    except ProductNotYoursError:
        raise ProductNotYoursHTTPError
    return {"status": "OK"}