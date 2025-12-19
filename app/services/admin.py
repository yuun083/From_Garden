from sqlalchemy import select, func
from app.database.db_manager import DBManager
from app.models.users import User
from app.models.roles import Role
from app.models.farms import Farm
from app.models.products import Product
from app.models.orders import Order
from app.models.reviews import Review
from app.models.categories import Category


class AdminService:
    def __init__(self, db: DBManager):
        self.db = db

    async def get_dashboard_stats(self) -> dict:
        """Получить основные статистики для админ-панели"""
        try:
            # Количество всех пользователей
            total_users = await self.db.execute(
                select(func.count(User.id))
            )
            total_users = total_users.scalar()

            # Количество ферм
            total_farms = await self.db.execute(
                select(func.count(Farm.id))
            )
            total_farms = total_farms.scalar()

            # Количество продуктов
            total_products = await self.db.execute(
                select(func.count(Product.id))
            )
            total_products = total_products.scalar()

            # Количество заказов
            total_orders = await self.db.execute(
                select(func.count(Order.id))
            )
            total_orders = total_orders.scalar()

            # Количество отзывов
            total_reviews = await self.db.execute(
                select(func.count(Review.id))
            )
            total_reviews = total_reviews.scalar()

            return {
                "total_users": total_users or 0,
                "total_farms": total_farms or 0,
                "total_products": total_products or 0,
                "total_orders": total_orders or 0,
                "total_reviews": total_reviews or 0,
            }
        except Exception as e:
            raise Exception(f"Ошибка получения статистики: {str(e)}")

    async def get_all_users(self, page: int = 1, per_page: int = 10) -> tuple[list, int]:
        """Получить всех пользователей с пагинацией"""
        offset = (page - 1) * per_page
        users = await self.db.users.get_all_with_roles(offset=offset, limit=per_page)
        
        total = await self.db.execute(select(func.count(User.id)))
        total = total.scalar() or 0
        
        return users, total

    async def change_user_role(self, user_id: int, new_role: str) -> None:
        """Изменить роль пользователя"""
        user = await self.db.users.get_one(id=user_id)
        if not user:
            raise ValueError(f"Пользователь с ID {user_id} не найден")

        # Получить role_id по названию
        role = await self.db.roles.get_one(name=new_role)
        if not role:
            raise ValueError(f"Роль '{new_role}' не найдена")

        user.role_id = role.id
        await self.db.commit()

    async def delete_user(self, user_id: int) -> None:
        """Удалить пользователя"""
        user = await self.db.users.get_one(id=user_id)
        if not user:
            raise ValueError(f"Пользователь с ID {user_id} не найден")
        
        await self.db.delete(user)
        await self.db.commit()

    async def get_all_farms(self, page: int = 1, per_page: int = 10) -> tuple[list, int]:
        """Получить все фермы с пагинацией"""
        offset = (page - 1) * per_page
        farms = await self.db.farms.get_all(offset=offset, limit=per_page)
        
        total = await self.db.execute(select(func.count(Farm.id)))
        total = total.scalar() or 0
        
        return farms, total

    async def delete_farm(self, farm_id: int) -> None:
        """Удалить ферму"""
        farm = await self.db.farms.get_one(id=farm_id)
        if not farm:
            raise ValueError(f"Ферма с ID {farm_id} не найдена")
        
        await self.db.delete(farm)
        await self.db.commit()

    async def get_all_products(self, page: int = 1, per_page: int = 10) -> tuple[list, int]:
        """Получить все продукты с пагинацией"""
        offset = (page - 1) * per_page
        products = await self.db.products.get_all(offset=offset, limit=per_page)
        
        total = await self.db.execute(select(func.count(Product.id)))
        total = total.scalar() or 0
        
        return products, total

    async def delete_product(self, product_id: int) -> None:
        """Удалить продукт"""
        product = await self.db.products.get_one(id=product_id)
        if not product:
            raise ValueError(f"Продукт с ID {product_id} не найден")
        
        await self.db.delete(product)
        await self.db.commit()

    async def get_all_orders(self, page: int = 1, per_page: int = 10) -> tuple[list, int]:
        """Получить все заказы с пагинацией"""
        offset = (page - 1) * per_page
        orders = await self.db.orders.get_all(offset=offset, limit=per_page)
        
        total = await self.db.execute(select(func.count(Order.id)))
        total = total.scalar() or 0
        
        return orders, total

    async def get_all_reviews(self, page: int = 1, per_page: int = 10) -> tuple[list, int]:
        """Получить все отзывы с пагинацией"""
        offset = (page - 1) * per_page
        reviews = await self.db.reviews.get_all(offset=offset, limit=per_page)
        
        total = await self.db.execute(select(func.count(Review.id)))
        total = total.scalar() or 0
        
        return reviews, total

    async def delete_review(self, review_id: int) -> None:
        """Удалить отзыв"""
        review = await self.db.reviews.get_one(id=review_id)
        if not review:
            raise ValueError(f"Отзыв с ID {review_id} не найден")
        
        await self.db.delete(review)
        await self.db.commit()

    async def get_all_categories(self) -> list:
        """Получить все категории"""
        return await self.db.categories.get_all()

    async def create_category(self, category_name: str) -> None:
        """Создать новую категорию"""
        if not category_name or len(category_name.strip()) == 0:
            raise ValueError("Название категории не может быть пустым")
        
        existing = await self.db.execute(
            select(Category).where(Category.name == category_name)
        )
        if existing.scalar():
            raise ValueError(f"Категория '{category_name}' уже существует")
        
        new_category = Category(name=category_name)
        await self.db.add(new_category)
        await self.db.commit()

    async def delete_category(self, category_id: int) -> None:
        """Удалить категорию"""
        category = await self.db.categories.get_one(id=category_id)
        if not category:
            raise ValueError(f"Категория с ID {category_id} не найдена")
        
        await self.db.delete(category)
        await self.db.commit()
