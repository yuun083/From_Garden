from fastapi import APIRouter

from app.api.dependencies import DBDep, CurrentUserDep, IsAdminDep
from app.exceptions.reviews import (
    ReviewNotFoundError,
    ReviewNotFoundHTTPError,
    ReviewAlreadyExistsError,
    ReviewAlreadyExistsHTTPError,
)
from app.schemes.reviews import SReviewAdd, SReviewGet
from app.services.reviews import ReviewService

router = APIRouter(prefix="/reviews", tags=["Отзывы"])

@router.get("", summary="Получение списка отзывов")
async def get_all_reviews(
    db: DBDep,
) -> list[SReviewGet]:
    return await ReviewService(db).get_reviews()

@router.get("/{id}", summary="Получение конкретного отзыва")
async def get_review(
    id: int,
    db: DBDep,
) -> SReviewGet:
    try:
        return await ReviewService(db).get_review(review_id=id)
    except ReviewNotFoundError:
        raise ReviewNotFoundHTTPError

@router.post("", summary="Создание отзыва")
async def create_review(
    review_data: SReviewAdd,
    db: DBDep,
    current_user: CurrentUserDep,
) -> dict[str, str]:
    try:
        await ReviewService(db).create_review(user_id=current_user.id, review_data=review_data)
    except ReviewAlreadyExistsError:
        raise ReviewAlreadyExistsHTTPError
    return {"status": "OK"}

@router.put("/{id}", summary="Изменение отзыва")
async def update_review(
    id: int,
    review_data: SReviewAdd,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    try:
        await ReviewService(db).update_review(review_id=id, review_data=review_data)
    except ReviewNotFoundError:
        raise ReviewNotFoundHTTPError
    return {"status": "OK"}

@router.delete("/{id}", summary="Удаление отзыва")
async def delete_review(
    id: int,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    try:
        await ReviewService(db).delete_review(review_id=id)
    except ReviewNotFoundError:
        raise ReviewNotFoundHTTPError
    return {"status": "OK"}