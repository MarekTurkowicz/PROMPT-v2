import pytest

from app.domain.exceptions import OrganizationSettingsInvalidError, ValidationError
from app.domain.value_objects import HealthThresholds, OrganizationSettings

VALID = {
    "timezone": "Europe/Warsaw",
    "currency": "PLN",
    "priority_names": ["Lowest", "Low", "Medium", "High", "Highest"],
}


@pytest.mark.parametrize("missing", ["timezone", "currency", "priority_names"])
def test_settings_without_a_required_key_are_rejected(missing: str) -> None:
    # PRD 1.1 Organization AK2
    data = {key: value for key, value in VALID.items() if key != missing}

    with pytest.raises(OrganizationSettingsInvalidError) as error:
        OrganizationSettings.from_dict(data)

    assert missing in error.value.extra["errors"]


@pytest.mark.parametrize(
    "change",
    [
        {"timezone": "Mars/Olympus"},
        {"currency": "pln"},
        {"currency": "PLNX"},
        {"priority_names": ["Low", "Medium", "High", "Highest"]},
        {"priority_names": ["Lowest", "Low", " ", "High", "Highest"]},
        {"working_days": []},
        {"working_days": [1, 1, 2]},
        {"working_days": [0, 1]},
        {"working_days": [7, 8]},
        {"health_thresholds": {"budget_warn_pct": -1}},
        {"health_thresholds": {"unknown_pct": 10}},
        {"history_retention_days": 0},
        {"unknown_key": True},
    ],
)
def test_invalid_settings_are_rejected(change: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        OrganizationSettings.from_dict({**VALID, **change})


def test_optional_settings_have_defaults() -> None:
    settings = OrganizationSettings.from_dict(VALID)

    assert settings.working_days == (1, 2, 3, 4, 5)
    assert settings.health_thresholds == HealthThresholds(
        overdue_risk_pct=20, budget_warn_pct=90, budget_risk_pct=100, hours_warn_pct=110
    )
    assert settings.history_retention_days is None


def test_working_days_are_sorted() -> None:
    settings = OrganizationSettings.from_dict({**VALID, "working_days": [6, 1, 3]})

    assert settings.working_days == (1, 3, 6)


def test_settings_survive_a_round_trip_through_a_dict() -> None:
    settings = OrganizationSettings.from_dict(
        {**VALID, "health_thresholds": {"budget_warn_pct": 80}, "history_retention_days": 365}
    )

    assert OrganizationSettings.from_dict(settings.to_dict()) == settings
