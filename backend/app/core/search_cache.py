from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from time import time

from app.models.schemas import SearchResponse


@dataclass
class CachedSearchEntry:
    expires_at: float
    value: SearchResponse


class InMemorySearchCache:
    """
    Temporary in-memory deduplication for identical search requests.

    This cache is intentionally short-lived and local to the running process. It exists to
    reduce duplicate Google Places requests during local development and normal retry-heavy use,
    not to persist Places content long term.
    """

    def __init__(self, *, ttl_seconds: int) -> None:
        self.ttl_seconds = ttl_seconds
        self._entries: dict[str, CachedSearchEntry] = {}

    def get(self, key: str) -> SearchResponse | None:
        entry = self._entries.get(key)
        if entry is None:
            return None

        if entry.expires_at <= time():
            self._entries.pop(key, None)
            return None

        return entry.value

    def set(self, key: str, value: SearchResponse) -> SearchResponse:
        self._entries[key] = CachedSearchEntry(
            expires_at=time() + self.ttl_seconds,
            value=value,
        )
        return value

    async def get_or_set(
        self,
        key: str,
        factory: Callable[[], SearchResponse | Awaitable[SearchResponse]],
    ) -> SearchResponse:
        cached = self.get(key)
        if cached is not None:
            return cached

        value = factory()
        if hasattr(value, "__await__"):
            value = await value

        if not isinstance(value, SearchResponse):
            raise TypeError("Search cache factory must return a SearchResponse.")

        return self.set(key, value)

    def clear(self) -> None:
        self._entries.clear()
