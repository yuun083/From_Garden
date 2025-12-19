from fastapi import APIRouter

from app.api.dependencies import DBDep, CurrentUserDep, IsAdminDep, IsFarmerOrAdminDep
from app.exceptions.farms import (
    FarmNotFoundError,
    FarmNotFoundHTTPError,
    FarmAlreadyExistsError,
    FarmAlreadyExistsHTTPError,
)
from app.schemes.farms import SFarmAdd, SFarmGet, SFarmApplicationResponse
from app.services.farms import FarmService

router = APIRouter(prefix="/farms", tags=["Фермы"])

@router.get("", summary="Получение списка ферм")
async def get_all_farms(
    db: DBDep,
) -> list[SFarmGet]:
    return await FarmService(db).get_farms()

@router.post("/applications", summary="Подача заявки на регистрацию фермы")
async def create_farm_application(
    farm_data: SFarmAdd,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await FarmService(db).create_application(user_id=current_user.id, farm_data=farm_data)
    except FarmAlreadyExistsError:
        raise FarmAlreadyExistsHTTPError
    return {"status": "OK"}

@router.get("/applications", summary="Получение списка заявок (только для админов)")
async def get_applications(
    db: DBDep,
    is_admin: IsAdminDep,
) -> list[SFarmApplicationResponse]:
    return await FarmService(db).get_applications()

@router.post("/applications/{application_id}/approve", summary="Одобрение заявки (только для админов)")
async def approve_application(
    application_id: int,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    try:
        await FarmService(db).approve_application(application_id=application_id)
    except FarmNotFoundError:
        raise FarmNotFoundHTTPError
    return {"status": "OK"}

@router.post("/applications/{application_id}/reject", summary="Отклонение заявки (только для админов)")
async def reject_application(
    application_id: int,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    try:
        await FarmService(db).reject_application(application_id=application_id)
    except FarmNotFoundError:
        raise FarmNotFoundHTTPError
    return {"status": "OK"}

@router.put("/{id}", summary="Изменение фермы")
async def update_farm(
    id: int,
    farm_data: SFarmAdd,
    db: DBDep,
    user: IsFarmerOrAdminDep,
) -> dict[str, str]:
    try:
        await FarmService(db).update_farm(farm_id=id, farm_data=farm_data, user_id=user)
    except FarmNotFoundError:
        raise FarmNotFoundHTTPError
    return {"status": "OK"}


@router.delete("/{id}", summary="Удаление фермы")
async def delete_farm(
    id: int,
    db: DBDep,
    user: IsFarmerOrAdminDep,
) -> dict[str, str]:
    try:
        await FarmService(db).delete_farm(farm_id=id, user_id=user)
    except FarmNotFoundError:
        raise FarmNotFoundHTTPError
    return {"status": "OK"}