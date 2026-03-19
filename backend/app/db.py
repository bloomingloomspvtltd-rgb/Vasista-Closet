from motor.motor_asyncio import AsyncIOMotorClient

from .config import settings


_client = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def get_db():
    return get_client()[settings.mongodb_db]
