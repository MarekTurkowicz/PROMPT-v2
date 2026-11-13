from collections.abc import Mapping
from typing import Annotated, Self
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import pydantic
from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.domain.exceptions import OrganizationSettingsInvalidError

CURRENCY_PATTERN = r"^[A-Z]{3}$"

Percent = Annotated[int, Field(ge=0)]
PriorityName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
IsoWeekday = Annotated[int, Field(ge=1, le=7)]  # 1 = Monday … 7 = Sunday


class HealthThresholds(BaseModel):
    """Defaults are the PRD 2.1 §4.3 values."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    overdue_risk_pct: Percent = 20
    budget_warn_pct: Percent = 90
    budget_risk_pct: Percent = 100
    hours_warn_pct: Percent = 110


class OrganizationSettings(BaseModel):
    """Build from outside data with ``from_dict`` so errors become a ``DomainError``."""

    model_config = ConfigDict(frozen=True, extra="forbid")

    timezone: str
    currency: Annotated[str, Field(pattern=CURRENCY_PATTERN)]
    priority_names: tuple[PriorityName, PriorityName, PriorityName, PriorityName, PriorityName]
    working_days: Annotated[tuple[IsoWeekday, ...], Field(min_length=1)] = (1, 2, 3, 4, 5)
    health_thresholds: HealthThresholds = HealthThresholds()
    history_retention_days: Annotated[int, Field(ge=1)] | None = None  # None = keep forever

    @field_validator("timezone")
    @classmethod
    def _known_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValueError(f"unknown IANA time zone {value!r}") from None
        return value

    @field_validator("working_days")
    @classmethod
    def _distinct_working_days(cls, value: tuple[int, ...]) -> tuple[int, ...]:
        if len(set(value)) != len(value):
            raise ValueError("working days must not repeat")
        return tuple(sorted(value))

    @classmethod
    def from_dict(cls, data: Mapping[str, object]) -> Self:
        try:
            return cls.model_validate(data)
        except pydantic.ValidationError as exc:
            errors: dict[str, list[str]] = {}
            for error in exc.errors():
                field = ".".join(str(part) for part in error["loc"]) or "settings"
                errors.setdefault(field, []).append(error["msg"])
            raise OrganizationSettingsInvalidError(extra={"errors": errors}) from None

    def to_dict(self) -> dict[str, object]:
        return self.model_dump(mode="json")
