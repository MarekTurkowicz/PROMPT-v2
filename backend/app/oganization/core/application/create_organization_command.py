from collections.abc import Sequence
from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class CreateOrganizationCommand:
    name: str
    tax_id: str | None = None
    timezone: str | None = None
    currency: str | None = None
    priority_levels: Sequence[str] | None = None
