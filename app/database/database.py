from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool
from app.config import settings

DATABASE_URL = settings.get_db_url

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DB_TYPE == "sqlite" else {},
    poolclass=StaticPool if settings.DB_TYPE == "sqlite" else None,
    echo=False
)

async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)