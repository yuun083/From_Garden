from app.exceptions.base import MyAppError, MyAppHTTPError

class CategoryNotFoundError(MyAppError):
    detail = "Категория не найдена"

class CategoryAlreadyExistsError(MyAppError):
    detail = "Категория с таким именем уже существует"

class CategoryNotFoundHTTPError(MyAppHTTPError):
    status_code = 404
    detail = "Категория не найдена"

class CategoryAlreadyExistsHTTPError(MyAppHTTPError):
    status_code = 409
    detail = "Категория с таким именем уже существует"