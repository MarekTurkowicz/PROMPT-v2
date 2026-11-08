from django.apps import AppConfig


def test_application_config_can_be_created() -> None:
    config = AppConfig.create("app.adapter.apps.ApplicationConfig")

    assert config.name == "app"
