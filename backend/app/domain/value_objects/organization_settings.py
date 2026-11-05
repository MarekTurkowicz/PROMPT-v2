from dataclasses import dataclass


@dataclass(frozen=True)
class OrganizationSettings:
    timezone: str
    currency: str
    priority_levels: tuple[str, str, str, str, str]
