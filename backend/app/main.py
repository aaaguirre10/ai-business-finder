from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes.health import router as health_router
from app.api.routes.leads import router as leads_router
from app.api.routes.locations import router as locations_router
from app.core.config import get_settings
from app.core.exceptions import UpstreamServiceError

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API for local business lead discovery within a selected map radius.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(UpstreamServiceError)
async def handle_upstream_service_error(_: Request, exc: UpstreamServiceError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


app.include_router(health_router, prefix="/api/v1")
app.include_router(locations_router, prefix="/api/v1")
app.include_router(leads_router, prefix="/api/v1")
