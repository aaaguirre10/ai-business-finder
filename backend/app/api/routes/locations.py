from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.core.config import get_settings
from app.core.rate_limit import InMemoryRateLimiter, get_client_key
from app.models.schemas import GeocodeResponse
from app.services.geocoding.base import GeocodingProvider
from app.services.geocoding.google import GoogleGeocodingProvider

router = APIRouter(prefix="/locations", tags=["locations"])


@lru_cache
def get_geocoding_provider() -> GeocodingProvider:
    settings = get_settings()
    return GoogleGeocodingProvider(settings)


@lru_cache
def get_locations_rate_limiter() -> InMemoryRateLimiter:
    settings = get_settings()
    return InMemoryRateLimiter(
        max_requests=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )


@router.get("/geocode", response_model=GeocodeResponse)
async def geocode_city(
    request: Request,
    city: str = Query(..., min_length=1, max_length=200),
    provider: GeocodingProvider = Depends(get_geocoding_provider),
    limiter: InMemoryRateLimiter = Depends(get_locations_rate_limiter),
) -> GeocodeResponse:
    limiter.check(get_client_key(request))
    normalized_city = city.strip()
    if not normalized_city:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="City must not be blank.",
        )

    result = await provider.geocode_city(normalized_city)
    return GeocodeResponse(
        city=result.city,
        formatted_location=result.formatted_location,
        latitude=result.latitude,
        longitude=result.longitude,
    )
