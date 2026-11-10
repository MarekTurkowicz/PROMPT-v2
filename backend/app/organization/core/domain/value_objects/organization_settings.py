from dataclasses import dataclass
from typing import Sequence

from app.organization.core.domain.exceptions import InvalidOrganizationSettings


@dataclass(frozen=True)
class OrganizationSettings:
    timezone: str | None
    currency: str | None
    priority_levels: Sequence[str] | None

    def __post_init__(self) -> None:
        levels = self.priority_levels
        if levels is None:
            return
        if len(levels) != 5 or any(level.strip() == "" for level in levels):
            raise InvalidOrganizationSettings(
                "priority_levels must contain exactly 5 non-empty values."
            )
