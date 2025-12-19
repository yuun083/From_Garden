from app.exceptions.base import MyAppError, MyAppHTTPError

class ProductNotFoundError(MyAppError):
    detail = "Товар не найден"

class ProductNotInStockError(MyAppError):
    detail = "Товара нет в наличии"

class ProductNotYoursError(MyAppError):
    detail = "Это не ваш товар"

class ProductNotFoundHTTPError(MyAppHTTPError):
    status_code = 404
    detail = "Товар не найден"

class ProductNotInStockHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Товара нет в наличии"

class ProductNotYoursHTTPError(MyAppHTTPError):
    status_code = 403
    detail = "Это не ваш товар"