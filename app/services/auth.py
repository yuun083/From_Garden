from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from typing import Optional

from app.config import settings
from app.exceptions.auth import (
    UserAlreadyExistsError,
    UserNotFoundError,
    InvalidPasswordError,
    InvalidJWTTokenError,
    PasswordTooLongError,
    PasswordTooShortError
)
from app.schemes.users import SUserAddRequest, UserAuth, UserProfile
from app.services.base import BaseService

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService(BaseService):
    def __init__(self, db_manager):
        super().__init__(db_manager)
        self.user_repository = db_manager.users
    
    async def register_user(self, user_data: SUserAddRequest) -> None:
        if len(user_data.password) > 40:
            raise PasswordTooLongError
        if len(user_data.password) < 6:
            raise PasswordTooShortError
        
        existing_user_by_email = await self.user_repository.get_by_email(user_data.email)
        if existing_user_by_email:
            raise UserAlreadyExistsError
        
        existing_user_by_username = await self.user_repository.get_by_username(user_data.username)
        if existing_user_by_username:
            raise UserAlreadyExistsError
        
        hashed_password = pwd_context.hash(user_data.password)
        
        user_to_create = {
            'email': user_data.email,
            'username': user_data.username,
            'hashed_password': hashed_password,
            'role_id': 2,
            'address': user_data.address
        }
        
        try:
            await self.user_repository.create(user_to_create)
            await self.user_repository.session.commit()
        except Exception as e:
            # Откатываем транзакцию в случае ошибки
            await self.user_repository.session.rollback()
            # Проверяем, является ли ошибка нарушением уникальности
            from sqlalchemy.exc import IntegrityError
            if isinstance(e, IntegrityError) and 'UNIQUE constraint failed' in str(e):
                raise UserAlreadyExistsError
            else:
                # Переподнимаем исключение, если это другая ошибка
                raise
    
    async def login_user(self, user_data: UserAuth) -> str:
        user = await self.db.users.get_by_email(user_data.email)
        if not user:
            raise UserNotFoundError
        
        if not pwd_context.verify(user_data.password, user.hashed_password):
            raise InvalidPasswordError
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = self._create_access_token(
            data={"sub": user.email, "user_id": user.id},
            expires_delta=access_token_expires
        )
        
        return access_token
    
    async def get_me(self, user_id: int) -> Optional[UserProfile]:
        user = await self.db.users.get_one_with_role(id=user_id)
        if not user:
            raise UserNotFoundError
        
        return UserProfile(
            id=user.id,
            email=user.email,
            username=user.username,
            role_id=user.role_id,
            phone=user.phone,
            address=user.address,
            card=user.card
        )
    



    async def update_user(self, user_id: int, update_data: dict) -> None:
        """Обновить данные пользователя"""
        try:
            await self.user_repository.update(user_id, update_data)
        except Exception:
            raise





    
    def _create_access_token(self, data: dict, expires_delta: timedelta = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
         
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt
     
    @staticmethod
    def decode_token(token: str) -> dict:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            return payload
        except jwt.PyJWTError:
            raise InvalidJWTTokenError
     
    async def delete_user(self, user_id: int) -> bool:
        try:
            user = await self.user_repository.get_by_id(user_id)
            if not user:
                return False
            
            await self.user_repository.delete(user_id)
            await self.user_repository.session.commit()
            return True
            
        except Exception:
            raise