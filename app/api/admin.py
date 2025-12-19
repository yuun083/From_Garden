from fastapi import APIRouter, HTTPException
from app.api.dependencies import DBDep, IsAdminDep, UserIdDep
from app.schemes.users import UserProfile
from app.services.admin import AdminService

router = APIRouter(prefix="/admin", tags=["Админ-панель"])


@router.get("/dashboard", summary="Получение статистики для админ-панели")
async def get_dashboard_stats(
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict:
    """Получить статистику платформы для админ-панели"""
    try:
        stats = await AdminService(db).get_dashboard_stats()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении статистики: {str(e)}")


@router.get("/users", summary="Получение списка всех пользователей (только для админов)")
async def get_all_users(
    db: DBDep,
    is_admin: IsAdminDep,
    page: int = 1,
    per_page: int = 10,
) -> dict:
    """Получить список всех пользователей с информацией о них"""
    try:
        users, total = await AdminService(db).get_all_users(page=page, per_page=per_page)
        return {
            "users": users,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении пользователей: {str(e)}")


@router.put("/users/{user_id}/role", summary="Изменение роли пользователя (только для админов)")
async def change_user_role(
    user_id: int,
    new_role: str,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    """Изменить роль пользователя (admin, farmer, customer)"""
    valid_roles = ["admin", "farmer", "customer"]
    if new_role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Неверная роль. Допустимые: {valid_roles}")
    
    try:
        await AdminService(db).change_user_role(user_id=user_id, new_role=new_role)
        return {"status": "OK", "message": f"Роль пользователя изменена на {new_role}"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при изменении роли: {str(e)}")


@router.delete("/users/{user_id}", summary="Удаление пользователя (только для админов)")
async def delete_user_admin(
    user_id: int,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    """Удалить пользователя из системы"""
    try:
        await AdminService(db).delete_user(user_id=user_id)
        return {"status": "OK", "message": f"Пользователь с ID {user_id} удален"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении пользователя: {str(e)}")


@router.get("/farms", summary="Получение списка всех ферм (только для админов)")
async def get_all_farms_admin(
    db: DBDep,
    is_admin: IsAdminDep,
    page: int = 1,
    per_page: int = 10,
) -> dict:
    """Получить список всех ферм"""
    try:
        farms, total = await AdminService(db).get_all_farms(page=page, per_page=per_page)
        return {
            "farms": farms,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении ферм: {str(e)}")


@router.delete("/farms/{farm_id}", summary="Удаление фермы (только для админов)")
async def delete_farm_admin(
    farm_id: int,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    """Удалить ферму из системы"""
    try:
        await AdminService(db).delete_farm(farm_id=farm_id)
        return {"status": "OK", "message": f"Ферма с ID {farm_id} удалена"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении фермы: {str(e)}")


@router.get("/products", summary="Получение списка всех продуктов (только для админов)")
async def get_all_products_admin(
    db: DBDep,
    is_admin: IsAdminDep,
    page: int = 1,
    per_page: int = 10,
) -> dict:
    """Получить список всех продуктов на платформе"""
    try:
        products, total = await AdminService(db).get_all_products(page=page, per_page=per_page)
        return {
            "products": products,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении продуктов: {str(e)}")


@router.delete("/products/{product_id}", summary="Удаление продукта (только для админов)")
async def delete_product_admin(
    product_id: int,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    """Удалить продукт из системы"""
    try:
        await AdminService(db).delete_product(product_id=product_id)
        return {"status": "OK", "message": f"Продукт с ID {product_id} удален"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении продукта: {str(e)}")


@router.get("/orders", summary="Получение списка всех заказов (только для админов)")
async def get_all_orders_admin(
    db: DBDep,
    is_admin: IsAdminDep,
    page: int = 1,
    per_page: int = 10,
) -> dict:
    """Получить список всех заказов на платформе"""
    try:
        orders, total = await AdminService(db).get_all_orders(page=page, per_page=per_page)
        return {
            "orders": orders,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении заказов: {str(e)}")


@router.get("/reviews", summary="Получение списка всех отзывов (только для админов)")
async def get_all_reviews_admin(
    db: DBDep,
    is_admin: IsAdminDep,
    page: int = 1,
    per_page: int = 10,
) -> dict:
    """Получить список всех отзывов на платформе"""
    try:
        reviews, total = await AdminService(db).get_all_reviews(page=page, per_page=per_page)
        return {
            "reviews": reviews,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении отзывов: {str(e)}")


@router.delete("/reviews/{review_id}", summary="Удаление отзыва (только для админов)")
async def delete_review_admin(
    review_id: int,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    """Удалить отзыв из системы"""
    try:
        await AdminService(db).delete_review(review_id=review_id)
        return {"status": "OK", "message": f"Отзыв с ID {review_id} удален"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении отзыва: {str(e)}")


@router.get("/categories", summary="Получение списка категорий (только для админов)")
async def get_all_categories_admin(
    db: DBDep,
    is_admin: IsAdminDep,
) -> list:
    """Получить список всех категорий"""
    try:
        categories = await AdminService(db).get_all_categories()
        return categories
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении категорий: {str(e)}")


@router.post("/categories", summary="Создание новой категории (только для админов)")
async def create_category_admin(
    category_name: str,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    """Создать новую категорию продуктов"""
    try:
        await AdminService(db).create_category(category_name=category_name)
        return {"status": "OK", "message": f"Категория '{category_name}' создана"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при создании категории: {str(e)}")


@router.delete("/categories/{category_id}", summary="Удаление категории (только для админов)")
async def delete_category_admin(
    category_id: int,
    db: DBDep,
    is_admin: IsAdminDep,
) -> dict[str, str]:
    """Удалить категорию"""
    try:
        await AdminService(db).delete_category(category_id=category_id)
        return {"status": "OK", "message": f"Категория с ID {category_id} удалена"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении категории: {str(e)}")
