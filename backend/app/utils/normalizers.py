from typing import Any

from app.models.schemas import BusinessLead


def normalize_places_response(payload: dict[str, Any]) -> list[BusinessLead]:
    places = payload.get("places", [])
    leads: list[BusinessLead] = []

    for place in places:
        display_name = place.get("displayName") or {}
        lead = BusinessLead(
            place_id=place.get("id", ""),
            name=display_name.get("text", "Unknown Business"),
            address=place.get("formattedAddress", "Address unavailable"),
            phone=place.get("nationalPhoneNumber"),
            website_url=place.get("websiteUri"),
        )
        leads.append(lead)

    return [lead for lead in leads if lead.place_id]
