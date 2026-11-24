from typing import TYPE_CHECKING

from django.apps import AppConfig
from django.core import checks

if TYPE_CHECKING:
    from app.dependencies_container import DependenciesContainer


class ApplicationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "app"
    container: DependenciesContainer

    def ready(self) -> None:
        from app.dependencies_container import DependenciesContainer
        from app.shared.adapter.inbound.django.checks import check_public_endpoints

        self.container = DependenciesContainer()
        checks.register(check_public_endpoints, checks.Tags.security)
