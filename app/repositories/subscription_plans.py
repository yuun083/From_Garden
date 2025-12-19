from typing import Optional
from app.models.subscription_plans import SubscriptionPlan
from app.schemes.subscription import SSubscriptionPlanGet
from .base import BaseRepository

class SubscriptionPlanRepository(BaseRepository[SubscriptionPlan, SSubscriptionPlanGet]):
    def __init__(self, session):
        super().__init__(session, SubscriptionPlan, SSubscriptionPlanGet)
    
    async def get_plan_by_name(self, name: str) -> Optional[SubscriptionPlan]:
        return await self.get_one(name=name)