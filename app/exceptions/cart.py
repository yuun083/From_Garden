from app.exceptions.base import MyAppError, MyAppHTTPError

class CartItemNotFoundError(MyAppError):
    detail = "Товар в корзине не найден"

class CartItemAlreadyExistsError(MyAppError):
    detail = "Товар уже в корзине"

class CartItemNotFoundHTTPError(MyAppHTTPError):
    status_code = 404
    detail = "Товар в корзине не найден"

class CartItemAlreadyExistsHTTPError(MyAppHTTPError):
    status_code = 409
    detail = "Товар уже в корзине"