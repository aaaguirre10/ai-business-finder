from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


WebsiteStatus = Literal["has_website", "no_website", "unknown"]
WebsiteStatusFilter = Literal["all", "has_website", "no_website", "unknown"]


class SearchRequest(BaseModel):
    city: Optional[str] = Field(default=None, max_length=200)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    radius: int = Field(..., gt=0)
    limit: Optional[int] = Field(default=None, gt=0)

    @field_validator("city")
    @classmethod
    def normalize_city(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None


class GeocodeResponse(BaseModel):
    city: str
    formatted_location: str
    latitude: float
    longitude: float


class BusinessLead(BaseModel):
    place_id: str
    name: str
    address: str
    phone: Optional[str] = None
    website_status: WebsiteStatus = "unknown"
    website_url: Optional[str] = Field(default=None, exclude=True, repr=False)


class SearchCenter(BaseModel):
    latitude: float
    longitude: float


class SearchResponse(BaseModel):
    search_center: SearchCenter
    radius: int
    count: int
    results: list[BusinessLead]


class ExportRequest(BaseModel):
    search: SearchRequest
    website_status_filter: WebsiteStatusFilter = "all"


class GeocodeResult(BaseModel):
    city: str
    formatted_location: str
    latitude: float
    longitude: float


class LeadSearchParams(BaseModel):
    city: Optional[str]
    latitude: float
    longitude: float
    radius: int
    limit: int
    requested_radius: int
    requested_limit: Optional[int]

    @model_validator(mode="after")
    def ensure_positive_values(self) -> "LeadSearchParams":
        if self.radius <= 0:
            raise ValueError("radius must be positive")
        if self.limit <= 0:
            raise ValueError("limit must be positive")
        return self
