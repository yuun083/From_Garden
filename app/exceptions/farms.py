from app.exceptions.base import MyAppError, MyAppHTTPError

class FarmNotFoundError(MyAppError):
    detail = "Ферма не найдена"

class FarmAlreadyExistsError(MyAppError):
    detail = "У поставщика уже есть ферма"

class FarmApplicationNotFoundError(MyAppError):
    detail = "Заявка на ферму не найдена"

class FarmApplicationAlreadyProcessedError(MyAppError):
    detail = "Заявка уже обработана"

class FarmNotFoundHTTPError(MyAppHTTPError):
    status_code = 404
    detail = "Ферма не найдена"

class FarmAlreadyExistsHTTPError(MyAppHTTPError):
    status_code = 409
    detail = "У поставщика уже есть ферма"

class FarmApplicationNotFoundHTTPError(MyAppHTTPError):
    status_code = 404
    detail = "Заявка на ферму не найдена"

class FarmApplicationAlreadyProcessedHTTPError(MyAppHTTPError):
    status_code = 409
    detail = "Заявка уже обработана"