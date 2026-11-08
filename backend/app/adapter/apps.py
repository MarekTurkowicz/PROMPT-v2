from typing import Any

from django.apps import AppConfig


class ApplicationConfig(AppConfig):
    name = "app"
    container: dict[str, Any]

    def ready(self) -> None:
        from .dependencies_container import build_dependencies_container

        self.container = build_dependencies_container()
