from __future__ import annotations

from typing import Any

import httpx

from app.core.config import Settings
from app.core.exceptions import UpstreamServiceError
from app.models.schemas import GeocodeResult
from app.services.geocoding.base import GeocodingProvider


class GoogleGeocodingProvider(GeocodingProvider):
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def geocode_city(self, city: str) -> GeocodeResult:
        params = {
            "address": city,
            "key": self.settings.google_maps_api_key,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(self.settings.google_geocoding_base_url, params=params)

        if response.status_code >= 400:
            raise UpstreamServiceError("Failed to geocode the requested city.")

        payload: dict[str, Any] = response.json()
        status = payload.get("status")
        if status != "OK" or not payload.get("results"):
            if status == "ZERO_RESULTS":
                raise UpstreamServiceError("No matching city was found.", status_code=404)
            raise UpstreamServiceError("Failed to geocode the requested city.")

        result = payload["results"][0]
        location = result["geometry"]["location"]
        return GeocodeResult(
            city=city.strip(),
            formatted_location=result.get("formatted_address", city.strip()),
            latitude=location["lat"],
            longitude=location["lng"],
        )
