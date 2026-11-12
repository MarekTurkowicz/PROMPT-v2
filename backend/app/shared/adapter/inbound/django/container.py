from django.apps import apps

from app.apps import ApplicationConfig
from app.dependencies_container import DependenciesContainer


def get_container() -> DependenciesContainer:
    application = apps.get_app_config("app")
    if not isinstance(application, ApplicationConfig):
        raise RuntimeError("Application container is unavailable.")
    return application.container
