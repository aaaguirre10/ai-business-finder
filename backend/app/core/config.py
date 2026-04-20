from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    google_maps_api_key: str = Field(..., alias="GOOGLE_MAPS_API_KEY")
    rate_limit_requests: int = Field(30, alias="RATE_LIMIT_REQUESTS")
    rate_limit_window_seconds: int = Field(60, alias="RATE_LIMIT_WINDOW_SECONDS")
    default_result_limit: int = Field(20, alias="DEFAULT_RESULT_LIMIT")
    max_result_limit: int = Field(20, alias="MAX_RESULT_LIMIT")
    min_search_radius_meters: int = Field(100, alias="MIN_SEARCH_RADIUS_METERS")
    max_search_radius_meters: int = Field(5000, alias="MAX_SEARCH_RADIUS_METERS")
    search_cache_ttl_seconds: int = Field(180, alias="SEARCH_CACHE_TTL_SECONDS")
    frontend_origin: str = Field("http://127.0.0.1:5173", alias="FRONTEND_ORIGIN")
    google_geocoding_base_url: str = "https://maps.googleapis.com/maps/api/geocode/json"
    google_places_base_url: str = "https://places.googleapis.com/v1/places:searchNearby"
    app_name: str = "AI Business Finder API"
    app_version: str = "0.1.0"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
