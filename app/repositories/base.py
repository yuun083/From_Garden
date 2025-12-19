from typing import Type, TypeVar, Generic, List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from pydantic import BaseModel

ModelType = TypeVar("ModelType")
SchemaType = TypeVar("SchemaType", bound=BaseModel)

class BaseRepository(Generic[ModelType, SchemaType]):
    def __init__(self, session: AsyncSession, model: Type[ModelType], schema: Type[SchemaType]):
        self.session = session
        self.model = model
        self.schema = schema
    
    async def create(self, data: Dict[str, Any]) -> ModelType:
        instance = self.model(**data)
        self.session.add(instance)
        await self.session.commit()
        await self.session.refresh(instance)
        return instance
    
    async def get_one(self, **filter_by) -> Optional[ModelType]:
        query = select(self.model).filter_by(**filter_by)
        result = await self.session.execute(query)
        return result.scalars().one_or_none()
     
    async def get_one_with_role(self, **filter_by) -> Optional[ModelType]:
        """Базовая реализация метода, может быть переопределена в наследниках"""
        return await self.get_one(**filter_by)
    
    async def get_one_or_raise(self, **filter_by) -> ModelType:
        """Возвращает объект или вызывает исключение, если объект не найден"""
        obj = await self.get_one(**filter_by)
        if obj is None:
            from app.exceptions.base import ObjectNotFoundError
            raise ObjectNotFoundError()
        return obj
    
    async def get_all(self, **filter_by) -> List[ModelType]:
        query = select(self.model).filter_by(**filter_by)
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def update(self, id: int, data: Dict[str, Any]) -> ModelType:
        query = (
            update(self.model)
            .where(self.model.id == id)
            .values(**data)
        )
        await self.session.execute(query)
        await self.session.commit()
        
        updated_obj = await self.get_one(id=id)
        return updated_obj
    
    async def delete(self, id: int) -> None:
        query = delete(self.model).where(self.model.id == id)
        await self.session.execute(query)
        await self.session.commit()


    async def create_one(self, data: dict) -> ModelType:
        """Алиас для create (для совместимости)"""
        return await self.create(data)