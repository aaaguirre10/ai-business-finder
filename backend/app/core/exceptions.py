class UpstreamServiceError(Exception):
    """Raised when an upstream provider fails or returns an unexpected result."""

    def __init__(self, message: str, *, status_code: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
