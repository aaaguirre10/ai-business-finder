from __future__ import annotations

from typing import Any

import httpx

from app.core.config import Settings
from app.core.exceptions import UpstreamServiceError
from app.models.schemas import BusinessLead, LeadSearchParams
from app.services.website_classifier import classify_website_status
from app.utils.normalizers import normalize_places_response


class GooglePlacesService:
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

    async def search_businesses(self, params: LeadSearchParams) -> list[BusinessLead]:
        payload = {
            "maxResultCount": params.limit,
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": params.latitude, "longitude": params.longitude},
                    "radius": float(params.radius),
                }
            }
        }
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.settings.google_maps_api_key,
            "X-Goog-FieldMask": self.FIELD_MASK,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
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
