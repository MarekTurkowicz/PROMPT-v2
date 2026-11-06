from dataclasses import dataclass


@dataclass(frozen=True)
class OrganizationSettings:
    timezone: str | None
    currency: str | None
    priority_levels: tuple[str, str, str, str, str] | None
