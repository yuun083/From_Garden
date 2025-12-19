from app.database.db_manager import DBManager


class BaseService:
    def __init__(self, db_manager: DBManager):
        self.db = db_manager