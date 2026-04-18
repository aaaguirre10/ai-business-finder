from app.models.schemas import BusinessLead


def classify_website_status(lead: BusinessLead) -> BusinessLead:
    """
    Assign a lightweight website status after Nearby Search normalization.

    We intentionally keep this heuristic isolated from the API routes so it can be replaced later
    with a more accurate website-enrichment workflow without changing frontend contracts.
    """

    status = "has_website" if lead.website_url else "no_website"
    return lead.model_copy(update={"website_status": status})
