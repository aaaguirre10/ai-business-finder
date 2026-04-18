from __future__ import annotations

import csv
from datetime import datetime, timezone
from io import StringIO

from app.models.schemas import BusinessLead


def build_leads_csv(leads: list[BusinessLead]) -> str:
    buffer = StringIO()
    writer = csv.DictWriter(
        buffer,
        fieldnames=[
            "place_id",
            "name",
            "phone",
            "website_status",
            "notes",
            "contacted",
            "exported_at",
        ],
    )
    writer.writeheader()

    exported_at = datetime.now(timezone.utc).isoformat()
    for lead in leads:
        writer.writerow(
            {
                "place_id": lead.place_id,
                "name": lead.name,
                "phone": lead.phone or "",
                "website_status": lead.website_status,
                "notes": "",
                "contacted": "false",
                "exported_at": exported_at,
            }
        )

    return buffer.getvalue()
