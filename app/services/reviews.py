from app.services.base import BaseService
from app.exceptions.reviews import ReviewNotFoundError, ReviewAlreadyExistsError
from app.schemes.reviews import SReviewAdd, SReviewGet

class ReviewService(BaseService):
    def __init__(self, db_manager):
        super().__init__(db_manager)
        self.repository = db_manager.reviews
        self.user_repository = db_manager.users
    
    async def get_reviews(self) -> list[SReviewGet]:
        reviews = await self.repository.get_all()
        return [SReviewGet.model_validate(rev, from_attributes=True) for rev in reviews]
    
    async def get_review(self, review_id: int) -> SReviewGet:
        review = await self.repository.get_one(id=review_id)
        if not review:
            raise ReviewNotFoundError
        return SReviewGet.model_validate(review, from_attributes=True)
    
    async def create_review(self, user_id: int, review_data: SReviewAdd):
        existing = None
        if review_data.product_id:
            existing = await self.repository.get_user_product_review(user_id, review_data.product_id)
        elif review_data.farm_id:
            existing = await self.repository.get_user_farm_review(user_id, review_data.farm_id)
        
        if existing:
            raise ReviewAlreadyExistsError
        
        review_dict = review_data.model_dump()
        review_dict["user_id"] = user_id
        review = await self.repository.create(review_dict)
        return SReviewGet.model_validate(review, from_attributes=True)
    
    async def update_review(self, review_id: int, review_data: SReviewAdd):
        review = await self.repository.get_one(id=review_id)
        if not review:
            raise ReviewNotFoundError
        
        updated = await self.repository.update(review_id, review_data.model_dump())
        return SReviewGet.model_validate(updated, from_attributes=True)
    
    async def delete_review(self, review_id: int):
        review = await self.repository.get_one(id=review_id)
        if not review:
            raise ReviewNotFoundError
        
        await self.repository.delete(review_id)