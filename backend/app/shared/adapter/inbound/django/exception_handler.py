from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from app.shared.adapter.inbound.django.constants import ERROR_KIND_TO_HTTP_STATUS_MAP
from app.shared.core.domain.exceptions import ApplicationError


def exception_handler(exc, context):
    if isinstance(exc, ApplicationError):
        return Response(
            {"code": exc.code, "detail": exc.message, "params": exc.params},
            status=ERROR_KIND_TO_HTTP_STATUS_MAP[exc.kind],
        )
    return drf_exception_handler(exc, context)
