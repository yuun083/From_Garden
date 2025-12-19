from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import StaticPool
import sys
from pathlib import Path

# Добавляем путь к директории проекта в sys.path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from config import settings

DATABASE_URL = settings.get_db_url

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DB_TYPE == "sqlite" else {},
    poolclass=StaticPool if settings.DB_TYPE == "sqlite" else None,
    echo=False
)

async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()