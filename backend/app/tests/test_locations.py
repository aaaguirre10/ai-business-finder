from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import GeocodeResult
from app.api.routes.locations import get_geocoding_provider
from app.core.exceptions import UpstreamServiceError


class StubGeocodingProvider:
    async def geocode_city(self, city: str) -> GeocodeResult:
        return GeocodeResult(
            city=city,
            formatted_location="El Paso, TX, USA",
            latitude=31.7619,
            longitude=-106.485,
        )


class FailingGeocodingProvider:
    async def geocode_city(self, city: str) -> GeocodeResult:
        raise UpstreamServiceError("Failed to geocode the requested city.")


client = TestClient(app)


def test_geocode_city_returns_coordinates() -> None:
    app.dependency_overrides[get_geocoding_provider] = StubGeocodingProvider
    response = client.get("/api/v1/locations/geocode", params={"city": "El Paso, TX"})

    assert response.status_code == 200
    assert response.json()["formatted_location"] == "El Paso, TX, USA"

    app.dependency_overrides.clear()


def test_geocode_city_requires_non_blank_input() -> None:
    response = client.get("/api/v1/locations/geocode", params={"city": ""})
    assert response.status_code == 422


def test_geocode_city_returns_safe_upstream_error() -> None:
    app.dependency_overrides[get_geocoding_provider] = FailingGeocodingProvider
    response = client.get("/api/v1/locations/geocode", params={"city": "Nowhere"})

    assert response.status_code == 502
    assert response.json()["detail"] == "Failed to geocode the requested city."

    app.dependency_overrides.clear()
