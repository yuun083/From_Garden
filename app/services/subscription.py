from app.services.base import BaseService
from app.exceptions.subscriptions import (
    SubscriptionPlanNotFoundError,
    SubscriptionPlanAlreadyExistsError,
    UserAlreadySubscribedError,
    UserNotSubscribedError,
    UserSubscriptionNotFoundError
)
from app.schemes.subscription import SSubscriptionPlanAdd, SSubscriptionPlanGet, SUserSubscriptionGet

class SubscriptionService(BaseService):
    def __init__(self, db_manager):
        super().__init__(db_manager)
        self.plan_repository = db_manager.subscription_plans
        self.user_sub_repository = db_manager.user_subscriptions
    
    async def get_plans(self) -> list[SSubscriptionPlanGet]:
        plans = await self.plan_repository.get_all()
        return [SSubscriptionPlanGet.model_validate(plan, from_attributes=True) for plan in plans]
    
    async def get_plan(self, plan_id: int) -> SSubscriptionPlanGet:
        plan = await self.plan_repository.get_one(id=plan_id)
        if not plan:
            raise SubscriptionPlanNotFoundError
        return SSubscriptionPlanGet.model_validate(plan, from_attributes=True)
    
    async def create_plan(self, plan_data: SSubscriptionPlanAdd):
        existing = await self.plan_repository.get_plan_by_name(plan_data.name)
        if existing:
            raise SubscriptionPlanAlreadyExistsError
        
        plan = await self.plan_repository.create(plan_data.model_dump())
        return SSubscriptionPlanGet.model_validate(plan, from_attributes=True)
    
    async def update_plan(self, plan_id: int, plan_data: SSubscriptionPlanAdd):
        plan = await self.plan_repository.get_one(id=plan_id)
        if not plan:
            raise SubscriptionPlanNotFoundError
        
        if plan_data.name != plan.name:
            existing = await self.plan_repository.get_plan_by_name(plan_data.name)
            if existing:
                raise SubscriptionPlanAlreadyExistsError
        
        updated = await self.plan_repository.update(plan_id, plan_data.model_dump())
        return SSubscriptionPlanGet.model_validate(updated, from_attributes=True)
    
    async def delete_plan(self, plan_id: int):
        plan = await self.plan_repository.get_one(id=plan_id)
        if not plan:
            raise SubscriptionPlanNotFoundError
        
        await self.plan_repository.delete(plan_id)
    
    async def get_user_subscriptions(self, user_id: int) -> list[SUserSubscriptionGet]:
        subs = await self.user_sub_repository.get_by_user_id(user_id)
        return [SUserSubscriptionGet.model_validate(sub, from_attributes=True) for sub in subs]
    
    async def get_user_subscription(self, subscription_id: int, user_id: int) -> SUserSubscriptionGet:
        sub = await self.user_sub_repository.get_one(id=subscription_id)
        if not sub or sub.user_id != user_id:
            raise UserSubscriptionNotFoundError
        return SUserSubscriptionGet.model_validate(sub, from_attributes=True)
    
    async def subscribe_user(self, user_id: int, plan_id: int):
        plan = await self.plan_repository.get_one(id=plan_id)
        if not plan:
            raise SubscriptionPlanNotFoundError
        
        existing = await self.user_sub_repository.get_user_active_subscription(user_id)
        if existing:
            raise UserAlreadySubscribedError
        
        from datetime import date, timedelta
        start_date = date.today()
        next_delivery = start_date + timedelta(days=7)
        
        sub_data = {
            "user_id": user_id,
            "subscription_plan_id": plan_id,
            "start_date": start_date,
            "next_delivery_date": next_delivery,
            "status": "active"
        }
        
        sub = await self.user_sub_repository.create(sub_data)
        return SUserSubscriptionGet.model_validate(sub, from_attributes=True)
    
    async def unsubscribe_user(self, user_id: int, plan_id: int):
        sub = await self.user_sub_repository.get_user_subscription_by_plan(user_id, plan_id)
        if not sub:
            raise UserNotSubscribedError
        
        await self.user_sub_repository.update(sub.id, {"status": "cancelled"})