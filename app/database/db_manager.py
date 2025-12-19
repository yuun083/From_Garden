from app.database.database import async_session_maker
from app.repositories.roles import RolesRepository
from app.repositories.users import UsersRepository
from app.repositories.categories import CategoryRepository
from app.repositories.farms import FarmRepository
from app.repositories.products import ProductRepository
from app.repositories.reviews import ReviewRepository
from app.repositories.cart import CartRepository
from app.repositories.orders import OrderRepository
from app.repositories.order_items import OrderItemRepository
from app.repositories.subscription_plans import SubscriptionPlanRepository
from app.repositories.user_subscriptions import UserSubscriptionRepository


class DBManager:
    def __init__(self, session_factory):
        self.session_factory = session_factory

    async def __aenter__(self):
        self.session = self.session_factory()
        self.users = UsersRepository(self.session)
        self.roles = RolesRepository(self.session)
        self.categories = CategoryRepository(self.session)
        self.farms = FarmRepository(self.session)
        self.products = ProductRepository(self.session)
        self.reviews = ReviewRepository(self.session)
        self.cart = CartRepository(self.session)
        self.orders = OrderRepository(self.session)
        self.order_items = OrderItemRepository(self.session)
        self.subscription_plans = SubscriptionPlanRepository(self.session)
        self.user_subscriptions = UserSubscriptionRepository(self.session)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            await self.session.rollback()
        await self.session.close()

    async def commit(self):
        await self.session.commit()
