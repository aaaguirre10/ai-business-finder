from abc import ABC, abstractmethod

from app.models.schemas import GeocodeResult


class GeocodingProvider(ABC):
    @abstractmethod
    async def geocode_city(self, city: str) -> GeocodeResult:
        """Resolve a city name into coordinates."""
