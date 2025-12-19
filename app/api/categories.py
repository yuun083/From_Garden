from fastapi import APIRouter

from app.api.dependencies import DBDep, IsAdminDep, CurrentUserDep
from app.exceptions.categories import (
    CategoryNotFoundError,
    CategoryNotFoundHTTPError,
    CategoryAlreadyExistsError,
    CategoryAlreadyExistsHTTPError,
)
from app.schemes.categories import SCategoryAdd, SCategoryGet
from app.services.categories import CategoryService

router = APIRouter(prefix="/categories", tags=["Категории"])

@router.get("", summary="Получение списка категорий")
async def get_all_categories(
    db: DBDep,
) -> list[SCategoryGet]:
    return await CategoryService(db).get_categories()

@router.post("", summary="Создание новой категории")
async def create_new_category(
    category_data: SCategoryAdd,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    try:
        await CategoryService(db).create_category(category_data)
    except CategoryAlreadyExistsError:
        raise CategoryAlreadyExistsHTTPError
    return {"status": "OK"}

@router.put("/{id}", summary="Изменение категории")
async def update_category(
    id: int,
    category_data: SCategoryAdd,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    try:
        await CategoryService(db).update_category(category_id=id, category_data=category_data)
    except CategoryNotFoundError:
        raise CategoryNotFoundHTTPError
    except CategoryAlreadyExistsError:
        raise CategoryAlreadyExistsHTTPError
    return {"status": "OK"}

@router.delete("/{id}", summary="Удаление категории")
async def delete_category(
    id: int,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    try:
        await CategoryService(db).delete_category(category_id=id)
    except CategoryNotFoundError:
        raise CategoryNotFoundHTTPError
    return {"status": "OK"}