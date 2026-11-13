import logging
from http import HTTPStatus
from typing import Any

from rest_framework.exceptions import ValidationError as DrfValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from app.domain.exceptions import (
    AuthenticationError,
    ConflictError,
    DomainError,
    NotFoundError,
    PermissionDeniedError,
    ValidationError,
)

logger = logging.getLogger(__name__)

_HTTP_STATUS: dict[type[DomainError], HTTPStatus] = {
    NotFoundError: HTTPStatus.NOT_FOUND,
    ValidationError: HTTPStatus.BAD_REQUEST,
    ConflictError: HTTPStatus.CONFLICT,
    AuthenticationError: HTTPStatus.UNAUTHORIZED,
    PermissionDeniedError: HTTPStatus.FORBIDDEN,
}
_CATEGORY: dict[int, type[DomainError]] = {status: cls for cls, status in _HTTP_STATUS.items()}


def http_status(error: DomainError) -> HTTPStatus:
    return next(
        (status for cls, status in _HTTP_STATUS.items() if isinstance(error, cls)),
        HTTPStatus.INTERNAL_SERVER_ERROR,
    )


def exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """Every handled error is answered as ``{detail, extra, err_code}``."""
    if isinstance(exc, DomainError):
        response = Response(status=http_status(exc))
        error = exc
    else:
        drf_response = drf_exception_handler(exc, context)
        if drf_response is None:
            return None
        response = drf_response
        error = _from_drf(exc, response)

    _log(error, response.status_code)
    response.data = error.to_dict()
    return response


def _from_drf(exc: Exception, response: Response) -> DomainError:
    category = _CATEGORY.get(response.status_code, DomainError)
    if isinstance(exc, DrfValidationError):
        return category(extra={"errors": response.data})
    return category(str(response.data["detail"]))


def _log(error: DomainError, status_code: int) -> None:
    if status_code >= HTTPStatus.INTERNAL_SERVER_ERROR:
        logger.error(
            "%s: %s (%s)", type(error).__name__, error.detail, error.err_code, exc_info=error
        )
    else:
        logger.warning("%s: %s (%s)", type(error).__name__, error.detail, error.err_code)
