from app.exceptions.base import MyAppError, MyAppHTTPError

class SubscriptionPlanNotFoundError(MyAppError):
    detail = "План подписки не найден"

class SubscriptionPlanAlreadyExistsError(MyAppError):
    detail = "План подписки с таким именем уже существует"

class UserSubscriptionNotFoundError(MyAppError):
    detail = "Подписка пользователя не найдена"

class UserAlreadySubscribedError(MyAppError):
    detail = "Пользователь уже подписан на этот план"

class UserNotSubscribedError(MyAppError):
    detail = "Пользователь не подписан на этот план"

class SubscriptionPlanNotFoundHTTPError(MyAppHTTPError):
    status_code = 404
    detail = "План подписки не найден"

class SubscriptionPlanAlreadyExistsHTTPError(MyAppHTTPError):
    status_code = 409
    detail = "План подписки с таким именем уже существует"

class UserSubscriptionNotFoundHTTPError(MyAppHTTPError):
    status_code = 404
    detail = "Подписка пользователя не найдена"

class UserAlreadySubscribedHTTPError(MyAppHTTPError):
    status_code = 409
    detail = "Пользователь уже подписан на этот план"

class UserNotSubscribedHTTPError(MyAppHTTPError):
    status_code = 409
    detail = "Пользователь не подписан на этот план"