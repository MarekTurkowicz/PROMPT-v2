from dataclasses import dataclass
from typing import Sequence

from app.organization.core.domain.exceptions import (
    InvalidOrganizationSettingsState,
)


@dataclass(frozen=True)
class OrganizationSettings:
    timezone: str | None
    currency: str | None
    priority_levels: Sequence[str] | None

    def __post_init__(self) -> None:
        levels = self.priority_levels
        if levels is None:
            return
        if len(levels) < 3:
            raise InvalidOrganizationSettingsState(
                self, "priority_levels must contain more than/equal 3."
            )
        if any(level.strip() == "" for level in levels):
            raise InvalidOrganizationSettingsState(
                self, "priority_levels must contain non-empty values"
            )
