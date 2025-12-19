from app.exceptions.base import MyAppError, MyAppHTTPError

class OrderItemNotFoundError(MyAppError):
    detail = "Элемент заказа не найден"

class OrderItemAlreadyExistsError(MyAppError):
    detail = "Товар уже есть в заказе"

class OrderItemNotInOrderError(MyAppError):
    detail = "Элемент не принадлежит этому заказу"

class OrderItemNotYoursError(MyAppError):
    detail = "Этот заказ не принадлежит пользователю"

class OrderItemNotFoundHTTPError(MyAppHTTPError):
    status_code = 404
    detail = "Элемент заказа не найден"

class OrderItemAlreadyExistsHTTPError(MyAppHTTPError):
    status_code = 409
    detail = "Товар уже есть в заказе"

class OrderItemNotInOrderHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Элемент не принадлежит этому заказу"

# Удаляем дублирующиеся определения классов
    
class OrderItemNotYoursHTTPError(MyAppHTTPError):
    status_code = 403
    detail = "Этот заказ не принадлежит пользователю"