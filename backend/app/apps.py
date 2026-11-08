from __future__ import annotations
from typing import TYPE_CHECKING

from django.apps import AppConfig


if TYPE_CHECKING:
    from app.dependencies_container import DependenciesContainer


class ApplicationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "app"
    container: DependenciesContainer

    def ready(self) -> None:
        from app.dependencies_container import DependenciesContainer
        self.container = DependenciesContainer()
