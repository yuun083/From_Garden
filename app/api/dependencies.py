from typing import Annotated

from fastapi import Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.database.database import async_session_maker
from app.exceptions.auth import (
    InvalidJWTTokenError,
    InvalidTokenHTTPError,
    IsNotAdminHTTPError,
    NoAccessTokenHTTPError,
)
from app.models.users import User
from app.services.auth import AuthService
from app.database.db_manager import DBManager


class PaginationParams(BaseModel):
    page: int | None = Field(default=1, ge=1)
    per_page: int | None = Field(default=5, ge=1, le=30)


PaginationDep = Annotated[PaginationParams, Depends()]


def get_token(request: Request) -> str:
    token = request.cookies.get("access_token", None)
    if token is None:
        raise NoAccessTokenHTTPError
    return token


def get_current_user_id(token: str = Depends(get_token)) -> int:
    try:
        data = AuthService.decode_token(token)
    except InvalidJWTTokenError:
        raise InvalidTokenHTTPError
    return data["user_id"]


UserIdDep = Annotated[int, Depends(get_current_user_id)]


async def get_db():
    async with DBManager(session_factory=async_session_maker) as db:
        yield db


DBDep = Annotated[DBManager, Depends(get_db)]


async def check_is_admin(db: DBDep, user_id: UserIdDep) -> int:
    user = await db.users.get_one_with_role(id=user_id)
    if not user:
        raise InvalidTokenHTTPError
    
    if user.role.name == "admin":
        return user_id
    else:
        raise IsNotAdminHTTPError


IsAdminDep = Annotated[int, Depends(check_is_admin)]


async def get_current_user(db: DBDep, user_id: UserIdDep):
    user = await db.users.get_one_with_role(id=user_id)
    if not user:
        raise InvalidTokenHTTPError
    return user


CurrentUserDep = Annotated[User, Depends(get_current_user)]


async def check_is_farmer_or_admin(db: DBDep, user_id: UserIdDep) -> int:
    user = await db.users.get_one_with_role(id=user_id)
    if not user:
        raise InvalidTokenHTTPError
    
    if user.role.name in ["farmer", "admin"]:
        return user_id
    else:
        raise HTTPException(status_code=403, detail="Недостаточно прав")


IsFarmerOrAdminDep = Annotated[int, Depends(check_is_farmer_or_admin)]


from enum import Enum
from app.models.roles import Role


class RoleEnum(str, Enum):
    admin = "admin"
    farmer = "farmer"
    customer = "customer"




def get_current_user_with_role_dependency(required_role: RoleEnum):
    async def dependency(db: DBDep, user_id: UserIdDep) -> int:
        user = await db.users.get_one_with_role(id=user_id)
        if not user:
            raise InvalidTokenHTTPError
        
        if user.role.name == required_role.value:
            return user_id
        else:
            raise HTTPException(status_code=403, detail=f"Требуется роль {required_role.value}")
    
    dependency.__name__ = f"check_{required_role.value}_role"
    return dependency