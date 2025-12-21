from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os

# URL базы данных
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./garden.db")

# Создаем движок
engine = create_async_engine(DATABASE_URL, echo=True)

# Создаем фабрику сессий
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Базовый класс для моделей
Base = declarative_base()

# Функция для получения сессии (добавьте её)
async def get_db():
    async with async_session_maker() as session:
        yield session