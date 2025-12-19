from fastapi import HTTPException, status

class UserNotFoundError(Exception):
    pass

class UserNotFoundHTTPError(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

class UserValidationError(Exception):
    pass

class UserValidationHTTPError(HTTPException):
    def __init__(self, detail: str = "Некорректные данные пользователя"):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail
        )