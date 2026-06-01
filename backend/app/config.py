from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:password@localhost:5432/inventory_db"
    app_name: str = "Inventory & Order Management System"
    debug: bool = False

    class Config:
        env_file = ".env"


settings = Settings()
