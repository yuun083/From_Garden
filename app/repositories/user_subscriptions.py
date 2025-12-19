from typing import List, Optional
from app.models.user_subscriptions import UserSubscription
from app.schemes.subscription import SUserSubscriptionGet
from .base import BaseRepository

class UserSubscriptionRepository(BaseRepository[UserSubscription, SUserSubscriptionGet]):
    def __init__(self, session):
        super().__init__(session, UserSubscription, SUserSubscriptionGet)
    
    async def get_by_user_id(self, user_id: int) -> List[UserSubscription]:
        return await self.get_all(user_id=user_id)
    
    async def get_user_active_subscription(self, user_id: int) -> Optional[UserSubscription]:
        return await self.get_one(user_id=user_id, status="active")
    
    async def get_user_subscription_by_plan(self, user_id: int, plan_id: int) -> Optional[UserSubscription]:
        return await self.get_one(user_id=user_id, subscription_plan_id=plan_id)