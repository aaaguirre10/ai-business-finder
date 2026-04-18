from functools import lru_cache
from urllib.parse import quote

from fastapi import APIRouter, Depends, Request, Response

from app.core.config import Settings, get_settings
from app.core.rate_limit import InMemoryRateLimiter, get_client_key
from app.core.search_cache import InMemorySearchCache
from app.models.schemas import (
    BusinessLead,
    ExportRequest,
    LeadSearchParams,
    SearchCenter,
    SearchRequest,
    SearchResponse,
)
from app.services.google_places import GooglePlacesService
from app.utils.csv_export import build_leads_csv

router = APIRouter(prefix="/leads", tags=["leads"])


@lru_cache
def get_places_service() -> GooglePlacesService:
    settings = get_settings()
    return GooglePlacesService(settings)


@lru_cache
def get_leads_rate_limiter() -> InMemoryRateLimiter:
    settings = get_settings()
    return InMemoryRateLimiter(
        max_requests=settings.rate_limit_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )


@lru_cache
def get_search_cache() -> InMemorySearchCache:
    settings = get_settings()
    return InMemorySearchCache(ttl_seconds=settings.search_cache_ttl_seconds)


def build_search_params(payload: SearchRequest, settings: Settings) -> LeadSearchParams:
    radius = min(max(payload.radius, settings.min_search_radius_meters), settings.max_search_radius_meters)
    requested_limit = payload.limit
    limit = payload.limit or settings.default_result_limit
    limit = min(limit, settings.max_result_limit)
    return LeadSearchParams(
        city=payload.city,
        latitude=payload.latitude,
        longitude=payload.longitude,
        radius=radius,
        limit=limit,
        requested_radius=payload.radius,
        requested_limit=requested_limit,
    )


def build_search_cache_key(params: LeadSearchParams) -> str:
    rounded_latitude = round(params.latitude, 4)
    rounded_longitude = round(params.longitude, 4)
    normalized_city = (params.city or "").strip().lower()
    return "|".join(
        [
            normalized_city,
            f"{rounded_latitude:.4f}",
            f"{rounded_longitude:.4f}",
            str(params.radius),
            str(params.limit),
        ]
    )


async def execute_search(
    *,
    params: LeadSearchParams,
    service: GooglePlacesService,
    cache: InMemorySearchCache,
) -> SearchResponse:
    cache_key = build_search_cache_key(params)

    async def fetch_response() -> SearchResponse:
        results = await service.search_businesses(params)
        return SearchResponse(
            search_center=SearchCenter(latitude=params.latitude, longitude=params.longitude),
            radius=params.radius,
            count=len(results),
            results=results,
        )

    return await cache.get_or_set(cache_key, fetch_response)


def filter_results_for_export(
    response: SearchResponse,
    website_status_filter: str,
) -> list[BusinessLead]:
    if website_status_filter == "all":
        return response.results

    return [lead for lead in response.results if lead.website_status == website_status_filter]


@router.post("/search", response_model=SearchResponse)
async def search_leads(
    payload: SearchRequest,
    request: Request,
    service: GooglePlacesService = Depends(get_places_service),
    limiter: InMemoryRateLimiter = Depends(get_leads_rate_limiter),
    cache: InMemorySearchCache = Depends(get_search_cache),
    settings: Settings = Depends(get_settings),
) -> SearchResponse:
    limiter.check(get_client_key(request))
    params = build_search_params(payload, settings)
    return await execute_search(params=params, service=service, cache=cache)


@router.post("/export")
async def export_leads_csv(
    payload: ExportRequest,
    request: Request,
    service: GooglePlacesService = Depends(get_places_service),
    limiter: InMemoryRateLimiter = Depends(get_leads_rate_limiter),
    cache: InMemorySearchCache = Depends(get_search_cache),
    settings: Settings = Depends(get_settings),
) -> Response:
    limiter.check(get_client_key(request))
    params = build_search_params(payload.search, settings)
    search_response = await execute_search(params=params, service=service, cache=cache)
    filtered_results = filter_results_for_export(search_response, payload.website_status_filter)
    csv_content = build_leads_csv(filtered_results)
    filename = "leads-export.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{quote(filename)}"',
        },
    )
