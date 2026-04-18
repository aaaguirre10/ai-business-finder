from app.core.rate_limit import InMemoryRateLimiter


def test_rate_limiter_blocks_repeated_calls() -> None:
    limiter = InMemoryRateLimiter(max_requests=2, window_seconds=60)
    limiter.check("client-a")
    limiter.check("client-a")

    try:
        limiter.check("client-a")
    except Exception as exc:  # pragma: no cover - simplified assertion for HTTPException
        assert getattr(exc, "status_code", None) == 429
    else:  # pragma: no cover
        raise AssertionError("Expected limiter to raise after exceeding the request budget.")


def test_rate_limiter_isolated_per_client() -> None:
    limiter = InMemoryRateLimiter(max_requests=1, window_seconds=60)
    limiter.check("client-a")
    limiter.check("client-b")
