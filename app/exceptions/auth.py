from app.exceptions.base import MyAppError, MyAppHTTPError

class UserAlreadyExistsError(MyAppError):
    detail = "Пользователь с таким email уже существует"

class InvalidJWTTokenError(MyAppError):
    detail = "Неверный токен"

class JWTTokenExpiredError(MyAppError):
    detail = "Токен истек, необходимо снова авторизоваться"

class InvalidPasswordError(MyAppError):
    detail = "Неверный пароль"

class UserNotFoundError(MyAppError):
    detail = "Пользователя не существует"

class PasswordTooShortError(MyAppError):
    detail = "Пароль должен содержать минимум 6 символов"

class PasswordTooLongError(MyAppError):
    detail = "Пароль не должен превышать 40 символов"

class PasswordMissingUppercaseError(MyAppError):
    detail = "Пароль должен содержать хотя бы одну заглавную букву"

class PasswordMissingLowercaseError(MyAppError):
    detail = "Пароль должен содержать хотя бы одну строчную букву"

class PasswordMissingDigitError(MyAppError):
    detail = "Пароль должен содержать хотя бы одну цифру"

class PasswordMissingSpecialCharError(MyAppError):
    detail = "Пароль должен содержать хотя бы один специальный символ (!@#$%^&*)"

class EmptyFieldError(MyAppError):
    detail = "Поле не может быть пустым"

class InvalidEmailError(MyAppError):
    detail = "Некорректный формат email"

class PasswordsDoNotMatchError(MyAppError):
    detail = "Пароли не совпадают"

class WeakPasswordError(MyAppError):
    detail = "Пароль слишком слабый"

class InvalidTokenHTTPError(MyAppHTTPError):
    status_code = 401
    detail = "Неверный токен доступа"

class JWTTokenExpiredHTTPError(MyAppHTTPError):
    status_code = 401
    detail = "Токен истек, необходимо снова авторизоваться"

class NoAccessTokenHTTPError(MyAppHTTPError):
    status_code = 401
    detail = "Вы не предоставили токен доступа"

class UserAlreadyExistsHTTPError(MyAppHTTPError):
    status_code = 409
    detail = "Пользователь с таким email уже существует"

class UserNotFoundHTTPError(MyAppHTTPError):
    status_code = 401
    detail = "Пользователя не существует"

class IsNotAdminHTTPError(MyAppHTTPError):
    status_code = 403
    detail = "Недостаточно прав"

class InvalidPasswordHTTPError(MyAppHTTPError):
    status_code = 401
    detail = "Неверный пароль"

class PasswordTooShortHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Пароль должен содержать минимум 6 символов"

class PasswordTooLongHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Пароль не должен превышать 40 символов"

class PasswordMissingUppercaseHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Пароль должен содержать хотя бы одну заглавную букву"

class PasswordMissingLowercaseHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Пароль должен содержать хотя бы одну строчную букву"

class PasswordMissingDigitHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Пароль должен содержать хотя бы одну цифру"

class PasswordMissingSpecialCharHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Пароль должен содержать хотя бы один специальный символ (!@#$%^&*)"

class EmptyFieldHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Поле не может быть пустым"

class InvalidEmailHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Некорректный формат email"

class PasswordsDoNotMatchHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Пароли не совпадают"

class WeakPasswordHTTPError(MyAppHTTPError):
    status_code = 422
    detail = "Пароль слишком слабый"