from fastapi.testclient import TestClient

from app.api.routes.leads import get_places_service, get_search_cache
from app.main import app
from app.models.schemas import BusinessLead, PlacesSearchResult, SearchScanMetadata

client = TestClient(app)


class StubPlacesService:
    async def search_businesses(self, params):
        return PlacesSearchResult(
            results=[
                BusinessLead(
                    place_id="abc123",
                    name="North Mesa Dental",
                    address="123 Main St, El Paso, TX",
                    phone=None,
                    website_status="no_website",
                )
            ],
            scan_metadata=SearchScanMetadata(
                strategy="single",
                tiles_searched=1,
                raw_places_count=1,
                unique_places_count=1,
            )
        )


def test_search_leads_returns_normalized_results() -> None:
    app.dependency_overrides[get_places_service] = StubPlacesService
    get_search_cache().clear()
    response = client.post(
        "/api/v1/leads/search",
        json={
            "city": "El Paso, TX",
            "latitude": 31.7619,
            "longitude": -106.485,
            "radius": 1500,
            "limit": 20,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["results"][0]["phone"] is None
    assert body["results"][0]["place_id"] == "abc123"
    assert body["results"][0]["website_status"] == "no_website"
    assert body["scan_metadata"]["tiles_searched"] == 1

    app.dependency_overrides.clear()
    get_search_cache().clear()


def test_search_leads_rejects_invalid_latitude() -> None:
    response = client.post(
        "/api/v1/leads/search",
        json={"latitude": 91, "longitude": -106.485, "radius": 1500},
    )
    assert response.status_code == 422


def test_search_leads_clamps_radius_and_limit() -> None:
    class AssertingPlacesService:
        async def search_businesses(self, params):
            assert params.radius == 5000
            assert params.limit == 20
            return PlacesSearchResult(
                results=[],
                scan_metadata=SearchScanMetadata(
                    strategy="tiled",
                    tiles_searched=9,
                    raw_places_count=0,
                    unique_places_count=0,
                ),
            )

    app.dependency_overrides[get_places_service] = AssertingPlacesService
    get_search_cache().clear()
    response = client.post(
        "/api/v1/leads/search",
        json={
            "city": "El Paso, TX",
            "latitude": 31.7619,
            "longitude": -106.485,
            "radius": 99999,
            "limit": 999,
        },
    )

    assert response.status_code == 200
    assert response.json()["radius"] == 5000

    app.dependency_overrides.clear()
    get_search_cache().clear()


def test_search_leads_defaults_limit() -> None:
    class AssertingPlacesService:
        async def search_businesses(self, params):
            assert params.limit == 20
            return PlacesSearchResult(
                results=[],
                scan_metadata=SearchScanMetadata(
                    strategy="single",
                    tiles_searched=1,
                    raw_places_count=0,
                    unique_places_count=0,
                ),
            )

    app.dependency_overrides[get_places_service] = AssertingPlacesService
    get_search_cache().clear()
    response = client.post(
        "/api/v1/leads/search",
        json={
            "city": "El Paso, TX",
            "latitude": 31.7619,
            "longitude": -106.485,
            "radius": 1500,
        },
    )

    assert response.status_code == 200

    app.dependency_overrides.clear()
    get_search_cache().clear()


def test_identical_searches_use_short_lived_cache() -> None:
    class CountingPlacesService:
        def __init__(self) -> None:
            self.calls = 0

        async def search_businesses(self, params):
            self.calls += 1
            return PlacesSearchResult(
                results=[
                    BusinessLead(
                        place_id="abc123",
                        name="North Mesa Dental",
                        address="123 Main St, El Paso, TX",
                        phone=None,
                        website_status="no_website",
                    )
                ],
                scan_metadata=SearchScanMetadata(
                    strategy="single",
                    tiles_searched=1,
                    raw_places_count=1,
                    unique_places_count=1,
                )
            )

    service = CountingPlacesService()
    app.dependency_overrides[get_places_service] = lambda: service
    get_search_cache().clear()

    payload = {
        "city": "El Paso, TX",
        "latitude": 31.7619,
        "longitude": -106.485,
        "radius": 1500,
        "limit": 20,
    }
    first = client.post("/api/v1/leads/search", json=payload)
    second = client.post("/api/v1/leads/search", json=payload)

    assert first.status_code == 200
    assert second.status_code == 200
    assert service.calls == 1

    app.dependency_overrides.clear()
    get_search_cache().clear()


def test_export_uses_cached_results_and_filters_rows() -> None:
    class CountingPlacesService:
        def __init__(self) -> None:
            self.calls = 0

        async def search_businesses(self, params):
            self.calls += 1
            return PlacesSearchResult(
                results=[
                    BusinessLead(
                        place_id="with-site",
                        name="Site Business",
                        address="123 Main St, El Paso, TX",
                        phone="915-555-0100",
                        website_status="has_website",
                    ),
                    BusinessLead(
                        place_id="no-site",
                        name="No Site Business",
                        address="456 Mesa St, El Paso, TX",
                        phone=None,
                        website_status="no_website",
                    ),
                ],
                scan_metadata=SearchScanMetadata(
                    strategy="single",
                    tiles_searched=1,
                    raw_places_count=2,
                    unique_places_count=2,
                ),
            )

    service = CountingPlacesService()
    app.dependency_overrides[get_places_service] = lambda: service
    get_search_cache().clear()

    search_payload = {
        "city": "El Paso, TX",
        "latitude": 31.7619,
        "longitude": -106.485,
        "radius": 1500,
        "limit": 20,
    }
    client.post("/api/v1/leads/search", json=search_payload)
    export_response = client.post(
        "/api/v1/leads/export",
        json={
            "search": search_payload,
            "website_status_filter": "no_website",
        },
    )

    assert export_response.status_code == 200
    assert "text/csv" in export_response.headers["content-type"]
    assert "no-site" in export_response.text
    assert "with-site" not in export_response.text
    assert service.calls == 1

    app.dependency_overrides.clear()
    get_search_cache().clear()
