import asyncio

from app.core.config import Settings
from app.models.schemas import BusinessLead, LeadSearchParams
from app.services.google_places import GooglePlacesService, SearchTile, TilePlan


def build_params(radius: int) -> LeadSearchParams:
    return LeadSearchParams(
        city="El Paso, TX",
        latitude=31.7619,
        longitude=-106.485,
        radius=radius,
        limit=20,
        requested_radius=radius,
        requested_limit=20,
    )


def test_build_tile_plan_uses_single_search_for_small_radius() -> None:
    service = GooglePlacesService(Settings(GOOGLE_MAPS_API_KEY="test-key"))
    tile_plan = service._build_tile_plan(build_params(1000))

    assert tile_plan.strategy == "single"
    assert len(tile_plan.tiles) == 1
    assert tile_plan.tiles[0].radius == 1000


def test_build_tile_plan_uses_tiled_search_for_large_radius() -> None:
    service = GooglePlacesService(Settings(GOOGLE_MAPS_API_KEY="test-key"))
    tile_plan = service._build_tile_plan(build_params(5000))

    assert tile_plan.strategy == "tiled"
    assert len(tile_plan.tiles) == 9
    assert all(tile.radius <= service.MAX_TILE_RADIUS_METERS for tile in tile_plan.tiles)


def test_search_businesses_dedupes_places_across_tiles() -> None:
    class StubPlacesService(GooglePlacesService):
        def _build_tile_plan(self, params: LeadSearchParams) -> TilePlan:
            return TilePlan(
                strategy="tiled",
                tiles=[
                    SearchTile(latitude=params.latitude, longitude=params.longitude, radius=700),
                    SearchTile(latitude=params.latitude, longitude=params.longitude, radius=700),
                ],
            )

        async def _search_tile(self, *, client, tile, limit, use_distance_ranking):
            if tile.radius == 700 and tile.latitude == 31.7619:
                return [
                    BusinessLead(
                        place_id="duplicate-place",
                        name="Duplicate Lead",
                        address="123 Main St, El Paso, TX",
                        phone=None,
                        website_status="no_website",
                    ),
                    BusinessLead(
                        place_id="unique-place",
                        name="Unique Lead",
                        address="456 Main St, El Paso, TX",
                        phone=None,
                        website_status="no_website",
                    ),
                ]

            return []

    service = StubPlacesService(Settings(GOOGLE_MAPS_API_KEY="test-key"))
    result = asyncio.run(service.search_businesses(build_params(2500)))

    assert result.scan_metadata.strategy == "tiled"
    assert result.scan_metadata.tiles_searched == 2
    assert result.scan_metadata.raw_places_count == 4
    assert result.scan_metadata.unique_places_count == 2
    assert len(result.results) == 2
