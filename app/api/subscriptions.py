from fastapi import APIRouter

from app.api.dependencies import DBDep, CurrentUserDep, IsAdminDep
from app.exceptions.subscriptions import (
    SubscriptionPlanNotFoundError,
    SubscriptionPlanNotFoundHTTPError,
    SubscriptionPlanAlreadyExistsError,
    SubscriptionPlanAlreadyExistsHTTPError,
    UserAlreadySubscribedError,
    UserAlreadySubscribedHTTPError,
    UserNotSubscribedError,
    UserNotSubscribedHTTPError,
    UserSubscriptionNotFoundError,
    UserSubscriptionNotFoundHTTPError,
)
from app.schemes.subscription import SSubscriptionPlanAdd, SSubscriptionPlanGet, SUserSubscriptionGet
from app.services.subscription import SubscriptionService

router = APIRouter(prefix="/subscriptions", tags=["Подписки"])

@router.get("/plans", summary="Получение списка планов подписок")
async def get_subscription_plans(
    db: DBDep,
) -> list[SSubscriptionPlanGet]:
    return await SubscriptionService(db).get_plans()

@router.get("/plans/{id}", summary="Получение конкретного плана")
async def get_subscription_plan(
    id: int,
    db: DBDep,
) -> SSubscriptionPlanGet:
    try:
        return await SubscriptionService(db).get_plan(plan_id=id)
    except SubscriptionPlanNotFoundError:
        raise SubscriptionPlanNotFoundHTTPError

@router.post("/plans", summary="Создание нового плана подписки")
async def create_subscription_plan(
    plan_data: SSubscriptionPlanAdd,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    try:
        await SubscriptionService(db).create_plan(plan_data=plan_data)
    except SubscriptionPlanAlreadyExistsError:
        raise SubscriptionPlanAlreadyExistsHTTPError
    return {"status": "OK"}

@router.put("/plans/{id}", summary="Изменение плана подписки")
async def update_subscription_plan(
    id: int,
    plan_data: SSubscriptionPlanAdd,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    try:
        await SubscriptionService(db).update_plan(plan_id=id, plan_data=plan_data)
    except SubscriptionPlanNotFoundError:
        raise SubscriptionPlanNotFoundHTTPError
    return {"status": "OK"}

@router.delete("/plans/{id}", summary="Удаление плана подписки")
async def delete_subscription_plan(
    id: int,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    try:
        await SubscriptionService(db).delete_plan(plan_id=id)
    except SubscriptionPlanNotFoundError:
        raise SubscriptionPlanNotFoundHTTPError
    return {"status": "OK"}

@router.get("/user", summary="Получение подписок текущего пользователя")
async def get_user_subscriptions(
    db: DBDep,
    current_user: CurrentUserDep,
) -> list[SUserSubscriptionGet]:
    return await SubscriptionService(db).get_user_subscriptions(user_id=current_user.id)

@router.get("/user/{subscription_id}", summary="Получение конкретной подписки пользователя")
async def get_user_subscription(
    subscription_id: int,
    db: DBDep,
    current_user: CurrentUserDep,
) -> SUserSubscriptionGet:
    try:
        return await SubscriptionService(db).get_user_subscription(subscription_id=subscription_id, user_id=current_user.id)
    except UserSubscriptionNotFoundError:
        raise UserSubscriptionNotFoundHTTPError

@router.post("/user/subscribe/{plan_id}", summary="Добавление подписки пользователю")
async def subscribe_user(
    plan_id: int,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await SubscriptionService(db).subscribe_user(user_id=current_user.id, plan_id=plan_id)
    except SubscriptionPlanNotFoundError:
        raise SubscriptionPlanNotFoundHTTPError
    except UserAlreadySubscribedError:
        raise UserAlreadySubscribedHTTPError
    return {"status": "OK"}

@router.delete("/user/unsubscribe/{plan_id}", summary="Удаление подписки пользователя")
async def unsubscribe_user(
    plan_id: int,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await SubscriptionService(db).unsubscribe_user(user_id=current_user.id, plan_id=plan_id)
    except UserNotSubscribedError:
        raise UserNotSubscribedHTTPError
    return {"status": "OK"}