from http import HTTPStatus

import pytest
from rest_framework.exceptions import NotAuthenticated, Throttled
from rest_framework.exceptions import ValidationError as DrfValidationError
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView

from app.adapter.api.exception_handler import exception_handler
from app.domain.exceptions import (
    DomainError,
    DuplicateError,
    FieldRequiredError,
    NotFoundError,
)


@pytest.mark.parametrize(
    ("error", "status"),
    [
        (NotFoundError(), HTTPStatus.NOT_FOUND),
        (FieldRequiredError(), HTTPStatus.BAD_REQUEST),
        (DuplicateError(), HTTPStatus.BAD_REQUEST),
        (DomainError(), HTTPStatus.INTERNAL_SERVER_ERROR),
    ],
)
def test_domain_error_is_answered_with_its_category_status(
    error: DomainError, status: HTTPStatus
) -> None:
    response = exception_handler(error, {})

    assert response is not None
    assert response.status_code == status
    assert response.data == error.to_dict()


def test_drf_error_is_answered_in_the_same_envelope() -> None:
    response = exception_handler(NotAuthenticated(), {})

    assert response is not None
    assert response.status_code == HTTPStatus.UNAUTHORIZED
    assert response.data == {
        "detail": "Authentication credentials were not provided.",
        "extra": {},
        "err_code": "ERR_0014",
    }


def test_drf_validation_error_keeps_field_errors_in_extra() -> None:
    response = exception_handler(DrfValidationError({"name": ["This field is required."]}), {})

    assert response is not None
    assert response.status_code == HTTPStatus.BAD_REQUEST
    assert response.data == {
        "detail": "validation error",
        "extra": {"errors": {"name": ["This field is required."]}},
        "err_code": "ERR_0002",
    }


def test_drf_error_without_a_category_keeps_its_status_and_headers() -> None:
    response = exception_handler(Throttled(wait=30), {})

    assert response is not None
    assert response.status_code == HTTPStatus.TOO_MANY_REQUESTS
    assert response["Retry-After"] == "30"
    assert response.data["err_code"] == "ERR_0000"


def test_handler_is_used_by_drf_views() -> None:
    class MissingView(APIView):
        authentication_classes = ()
        permission_classes = ()

        def get(self, request: Request) -> Response:
            raise NotFoundError("project not found.", extra={"id": 7})

    response = MissingView.as_view()(APIRequestFactory().get("/"))

    assert response.status_code == HTTPStatus.NOT_FOUND
    assert response.data == {
        "detail": "project not found.",
        "extra": {"id": 7},
        "err_code": "ERR_0001",
    }
