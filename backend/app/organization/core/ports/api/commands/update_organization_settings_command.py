from collections.abc import Sequence
from dataclasses import dataclass

from app.shared.core.ports.api.unset import UNSET, Unset


@dataclass(frozen=True, slots=True)
class UpdateOrganizationSettingsCommand:
    organization_id: int
    timezone: str | None | Unset = UNSET
    currency: str | None | Unset = UNSET
    priority_levels: Sequence[str] | None | Unset = UNSET
