from typing import Dict, Any

from django.apps import AppConfig


class ApplicationConfig(AppConfig):
    name = 'application'
    container: Dict[str, Any]

    def ready(self) -> None:
        from application.dependencies_container import build_dependencies_container
        self.container = build_dependencies_container()
