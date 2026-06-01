import os
from pydantic_settings import BaseSettings


def get_database_url() -> str:
    url = os.environ.get(
        "DATABASE_URL",
        os.environ.get(
            "DATABASE_PUBLIC_URL",
            "postgresql://postgres:password@localhost:5432/inventory_db"
        )
    )
    # Railway sometimes provides postgres:// — SQLAlchemy needs postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


class Settings(BaseSettings):
    database_url: str = ""
    app_name: str = "Inventory & Order Management System"
    debug: bool = False

    def model_post_init(self, __context):
        if not self.database_url:
            object.__setattr__(self, "database_url", get_database_url())

    class Config:
        env_file = ".env"


settings = Settings()

# Ensure database_url is always resolved
if not settings.database_url:
    settings.database_url = get_database_url()
