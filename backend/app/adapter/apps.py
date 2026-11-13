from typing import Any

from django.apps import AppConfig


class ApplicationConfig(AppConfig):
    name = "app"
    container: dict[str, Any]

    def ready(self) -> None:
        from app.domain.exceptions import check_error_codes

        from .dependencies_container import build_dependencies_container

        check_error_codes()
        self.container = build_dependencies_container()
