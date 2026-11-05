from typing import Dict, Any

from django.apps import AppConfig


class ApplicationConfig(AppConfig):
    name = "application"
    container: Dict[str, Any]

    def ready(self) -> None:
        from .dependencies_container import DependenciesContainer
        container = DependenciesContainer()
