from fastapi import APIRouter, Depends, HTTPException
from starlette.responses import Response

from app.api.dependencies import RoleEnum, UserIdDep, get_current_user_with_role_dependency
from app.exceptions.auth import (
    UserAlreadyExistsError,
    UserAlreadyExistsHTTPError,
    UserNotFoundError,
    UserNotFoundHTTPError,
    InvalidPasswordError,
    InvalidPasswordHTTPError,
    PasswordTooLongError,
    PasswordTooShortError,
    EmptyFieldError,
    InvalidEmailError,
    PasswordTooLongHTTPError,
    PasswordTooShortHTTPError,
    EmptyFieldHTTPError,
    InvalidEmailHTTPError,
)
from app.schemes.users import SUserAddRequest, UserAuth, UserDeleteResponse, UserProfile, UserUpdate, UserPartialUpdate

from app.services.auth import AuthService
from app.database.db_manager import DBManager
from app.database.database import async_session_maker

router = APIRouter(prefix="/auth", tags=["Авторизация и аутентификация"])


async def get_db_manager():
    async with DBManager(async_session_maker) as db_manager:
        yield db_manager


@router.post("/register", summary="Регистрация нового пользователя")
async def register_user(
    user_data: SUserAddRequest,
    db_manager=Depends(get_db_manager)
) -> dict[str, str]:
    try:
        await AuthService(db_manager).register_user(user_data)
        return {"status": "OK", "message": "Пользователь успешно зарегистрирован"}
    except UserAlreadyExistsError:
        raise UserAlreadyExistsHTTPError
    except PasswordTooLongError:
        raise PasswordTooLongHTTPError
    except PasswordTooShortError:
        raise PasswordTooShortHTTPError
    except EmptyFieldError:
        raise EmptyFieldHTTPError
    except InvalidEmailError:
        raise InvalidEmailHTTPError


@router.post("/login", summary="Аутентификация пользователя")
async def login_user(
    response: Response,
    user_data: UserAuth,
    db_manager=Depends(get_db_manager)
) -> dict[str, str]:
    try:
        access_token: str = await AuthService(db_manager).login_user(user_data)
    except UserNotFoundError:
        raise UserNotFoundHTTPError
    except InvalidPasswordError:
        raise InvalidPasswordHTTPError
    
    response.set_cookie(
        "access_token",
        access_token,
        httponly=True,
        max_age=7*24*60*60,
        samesite="lax"
    )
    return {"access_token": access_token, "message": "Вход выполнен успешно"}


@router.get("/me", summary="Получение текущего пользователя для профиля")
async def get_me(
    user_id: UserIdDep,
    db_manager=Depends(get_db_manager)
) -> UserProfile:
    try:
        user = await AuthService(db_manager).get_me(user_id)
        return user
    except UserNotFoundError:
        raise UserNotFoundHTTPError

@router.patch("/me", summary="Частичное обновление профиля текущего пользователя")
async def patch_me(
    user_id: UserIdDep,
    user_data: UserPartialUpdate,
    db_manager=Depends(get_db_manager)
) -> dict[str, str]:
    try:
        await AuthService(db_manager).update_user(user_id, user_data.model_dump(exclude_unset=True))
        return {"status": "OK", "message": "Профиль обновлен"}
    except UserNotFoundError:
        raise UserNotFoundHTTPError

@router.put("/me", summary="Полное обновление профиля")
async def put_me(
    user_id: UserIdDep,
    user_data: UserUpdate,
    db_manager=Depends(get_db_manager)
) -> dict[str, str]:
    try:
        await AuthService(db_manager).update_user(user_id, user_data.model_dump(exclude_unset=True))
        return {"status": "OK", "message": "Профиль полностью обновлен"}
    except UserNotFoundError:
        raise UserNotFoundHTTPError

@router.post("/logout", summary="Выход пользователя из системы")
async def logout(response: Response) -> dict[str, str]:
    response.delete_cookie("access_token")
    return {"status": "OK", "message": "Выход выполнен успешно"}


@router.delete("/{user_id}", summary="Удаление пользователя (только для администраторов)")
async def delete_user(
    user_id: int,
    current_user: int = Depends(get_current_user_with_role_dependency(RoleEnum.admin)),
    db_manager=Depends(get_db_manager)
) -> UserDeleteResponse:
    try:
        success = await AuthService(db_manager).delete_user(user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        return UserDeleteResponse(status="OK", message=f"Пользователь с ID {user_id} удален")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении пользователя: {str(e)}")