from app.exceptions.base import MyAppError, MyAppHTTPError

class ReviewNotFoundError(MyAppError):
    detail = "Отзыв не найден"

class ReviewAlreadyExistsError(MyAppError):
    detail = "Вы уже оставляли отзыв"

class ReviewNotFoundHTTPError(MyAppHTTPError):
    status_code = 404
    detail = "Отзыв не найден"

class ReviewAlreadyExistsHTTPError(MyAppHTTPError):
    status_code = 409
    detail = "Вы уже оставляли отзыв"