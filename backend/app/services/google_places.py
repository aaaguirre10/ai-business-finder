from __future__ import annotations

import asyncio
from dataclasses import dataclass
from math import sqrt
from typing import Any

import httpx

from app.core.config import Settings
from app.core.exceptions import UpstreamServiceError
from app.models.schemas import (
    BusinessLead,
    LeadSearchParams,
    PlacesSearchResult,
    SearchScanMetadata,
)
from app.services.website_classifier import classify_website_status
from app.utils.normalizers import normalize_places_response


@dataclass(frozen=True)
class SearchTile:
    latitude: float
    longitude: float
    radius: int


@dataclass(frozen=True)
class TilePlan:
    strategy: str
    tiles: list[SearchTile]


class GooglePlacesService:
    TILE_SCAN_THRESHOLD_METERS = 1500
    EXTENDED_TILE_SCAN_THRESHOLD_METERS = 3000
    MIN_TILE_RADIUS_METERS = 500
    MAX_TILE_RADIUS_METERS = 1200
    FIELD_MASK = ",".join(
        [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.nationalPhoneNumber",
            # Keep the field mask minimal, but include websiteUri so we can classify website status
            # in the same Nearby Search response rather than triggering separate detail lookups.
            "places.websiteUri",
        ]
    )

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    async def search_businesses(self, params: LeadSearchParams) -> PlacesSearchResult:
        tile_plan = self._build_tile_plan(params)

        async with httpx.AsyncClient(timeout=20.0) as client:
            tile_results = await asyncio.gather(
                *[
                    self._search_tile(
                        client=client,
                        tile=tile,
                        limit=params.limit,
                        use_distance_ranking=tile_plan.strategy == "tiled",
                    )
                    for tile in tile_plan.tiles
                ]
            )

        raw_places_count = sum(len(leads) for leads in tile_results)
        deduped_results: dict[str, BusinessLead] = {}
        for leads in tile_results:
            for lead in leads:
                deduped_results.setdefault(lead.place_id, lead)

        results = list(deduped_results.values())
        return PlacesSearchResult(
            results=results,
            scan_metadata=SearchScanMetadata(
                strategy=tile_plan.strategy,
                tiles_searched=len(tile_plan.tiles),
                raw_places_count=raw_places_count,
                unique_places_count=len(results),
            ),
        )

    async def _search_tile(
        self,
        *,
        client: httpx.AsyncClient,
        tile: SearchTile,
        limit: int,
        use_distance_ranking: bool,
    ) -> list[BusinessLead]:
        payload = {
            "maxResultCount": limit,
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": tile.latitude, "longitude": tile.longitude},
                    "radius": float(tile.radius),
                }
            }
        }
        if use_distance_ranking:
            # Distance ranking helps each sub-search surface nearby places instead of repeating
            # only the most prominent places across a large radius.
            payload["rankPreference"] = "DISTANCE"

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.settings.google_maps_api_key,
            "X-Goog-FieldMask": self.FIELD_MASK,
        }

        response = await client.post(
            self.settings.google_places_base_url,
            json=payload,
            headers=headers,
        )

        if response.status_code >= 400:
            raise UpstreamServiceError("Failed to fetch businesses from Google Places.")

        data: dict[str, Any] = response.json()
        leads = normalize_places_response(data)
        classified_leads = [classify_website_status(lead) for lead in leads]

        # Future enrichment hook:
        # This post-processing step is where website detection can evolve beyond the initial
        # Nearby Search heuristic without changing route contracts or frontend request flow.
        return classified_leads

    def _build_tile_plan(self, params: LeadSearchParams) -> TilePlan:
        if params.radius < self.TILE_SCAN_THRESHOLD_METERS:
            return TilePlan(
                strategy="single",
                tiles=[
                    SearchTile(
                        latitude=params.latitude,
                        longitude=params.longitude,
                        radius=params.radius,
                    )
                ],
            )

        tile_radius = min(
            max(int(params.radius * 0.4), self.MIN_TILE_RADIUS_METERS),
            self.MAX_TILE_RADIUS_METERS,
        )
        desired_offset = int(params.radius * 0.45)
        offset = min(desired_offset, max(params.radius - tile_radius, 0))

        meter_offsets: list[tuple[float, float]] = [
            (0.0, 0.0),
            (offset, 0.0),
            (-offset, 0.0),
            (0.0, offset),
            (0.0, -offset),
        ]

        if params.radius >= self.EXTENDED_TILE_SCAN_THRESHOLD_METERS:
            diagonal_component = offset / sqrt(2)
            meter_offsets.extend(
                [
                    (diagonal_component, diagonal_component),
                    (diagonal_component, -diagonal_component),
                    (-diagonal_component, diagonal_component),
                    (-diagonal_component, -diagonal_component),
                ]
            )

        tiles = [
            SearchTile(
                latitude=params.latitude + self._meters_to_latitude(delta_north),
                longitude=params.longitude + self._meters_to_longitude(delta_east, params.latitude),
                radius=tile_radius,
            )
            for delta_east, delta_north in meter_offsets
        ]
        return TilePlan(strategy="tiled", tiles=tiles)

    @staticmethod
    def _meters_to_latitude(meters: float) -> float:
        return meters / 111_320

    @staticmethod
    def _meters_to_longitude(meters: float, latitude: float) -> float:
        from math import cos, radians

        divisor = 111_320 * max(cos(radians(latitude)), 0.01)
        return meters / divisor
