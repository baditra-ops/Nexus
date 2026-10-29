from fastapi import Request
from fastapi.responses import JSONResponse


class AIServiceException(Exception):
    """Base exception for Nexus AI service errors."""

    def __init__(self, message: str, status_code: int = 400, details: dict = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class InsufficientDataException(AIServiceException):
    """Raised when there is not enough historical operational data."""

    def __init__(self, message: str, required_records: int, available_records: int):
        super().__init__(
            message=message,
            status_code=422,
            details={
                "error_type": "INSUFFICIENT_DATA",
                "required_records": required_records,
                "available_records": available_records,
                "recommendation": "Use demo_mode=True to inspect sample benchmark analysis.",
            },
        )


async def ai_service_exception_handler(request: Request, exc: AIServiceException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.message,
            "status_code": exc.status_code,
            "details": exc.details,
        },
    )

