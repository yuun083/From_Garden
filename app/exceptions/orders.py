from app.exceptions.base import MyAppError, MyAppHTTPError

class OrderNotFoundError(MyAppError):
    detail = "Заказ не найден"

class OrderNotYoursError(MyAppError):
    detail = "Это не ваш заказ"

class OrderCannotBeCanceledError(MyAppError):
    detail = "Заказ нельзя отменить"

class OrderAlreadyProcessedError(MyAppError):
    detail = "Заказ уже обработан"

class OrderNotFoundHTTPError(MyAppHTTPError):
    status_code = 404
    detail = "Заказ не найден"

class OrderNotYoursHTTPError(MyAppHTTPError):
    status_code = 403
    detail = "Это не ваш заказ"

class OrderCannotBeCanceledHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Заказ нельзя отменить"

class OrderAlreadyProcessedHTTPError(MyAppHTTPError):
    status_code = 409
    detail = "Заказ уже обработан"