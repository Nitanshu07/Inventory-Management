from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:password@localhost:5432/inventory_db"
    app_name: str = "Inventory & Order Management System"
    debug: bool = False

    def __init__(self, **data):
        super().__init__(**data)
        # Railway provides postgres:// but SQLAlchemy requires postgresql://
        if self.database_url.startswith("postgres://"):
            self.database_url = self.database_url.replace("postgres://", "postgresql://", 1)

    class Config:
        env_file = ".env"


settings = Settings()
