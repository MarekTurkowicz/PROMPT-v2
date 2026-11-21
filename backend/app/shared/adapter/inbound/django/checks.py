from collections.abc import Iterator, Sequence
from typing import Any

from django.apps import AppConfig
from django.core import checks
from django.urls import URLPattern, URLResolver, get_resolver
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from app.shared.adapter.inbound.django.constants import PUBLIC_ENDPOINT_NAMES


def check_public_endpoints(
    app_configs: Sequence[AppConfig] | None, **kwargs: Any
) -> list[checks.CheckMessage]:
    errors: list[checks.CheckMessage] = []
    for route, pattern in _iter_url_patterns(get_resolver().url_patterns, prefix=""):
        view_class = getattr(pattern.callback, "cls", None)
        if not (isinstance(view_class, type) and issubclass(view_class, APIView)):
            continue

        initkwargs = getattr(pattern.callback, "initkwargs", {})
        permission_classes = initkwargs.get("permission_classes", view_class.permission_classes)
        allows_anonymous = any(
            isinstance(permission, type) and issubclass(permission, AllowAny)
            for permission in permission_classes
        )
        if allows_anonymous and pattern.name not in PUBLIC_ENDPOINT_NAMES:
            errors.append(
                checks.Error(
                    f"The view {view_class.__name__} at '{route}' allows anonymous access.",
                    hint="Remove AllowAny or add the route name to PUBLIC_ENDPOINT_NAMES.",
                    obj=view_class,
                    id="app.E001",
                )
            )
    return errors


def _iter_url_patterns(patterns: Sequence[Any], prefix: str) -> Iterator[tuple[str, URLPattern]]:
    for pattern in patterns:
        if isinstance(pattern, URLResolver):
            yield from _iter_url_patterns(pattern.url_patterns, prefix + str(pattern.pattern))
        elif isinstance(pattern, URLPattern):
            yield prefix + str(pattern.pattern), pattern
