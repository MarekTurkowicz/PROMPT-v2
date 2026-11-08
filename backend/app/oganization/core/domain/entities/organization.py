from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.oganization.core.domain.constants import ORGANIZATION_NAME_MAX_LENGTH
from app.oganization.core.domain.exceptions import InvalidOrganizationName
from app.oganization.core.domain.value_objects.organization_settings import (
    OrganizationSettings,
)
from app.oganization.core.domain.value_objects.organization_tax_id import (
    OrganizationTaxId,
)


@dataclass(frozen=True, slots=True)
class Organization:
    id: UUID | None
    name: str
    tax_id: OrganizationTaxId | None
    is_active: bool
    settings: OrganizationSettings
    created_at: datetime | None = None
    modified_at: datetime | None = None

    def __post_init__(self) -> None:
        name = self.name.strip()
        if not name or len(name) > ORGANIZATION_NAME_MAX_LENGTH:
            raise InvalidOrganizationName(
                f"Organization name must be between 1 and {ORGANIZATION_NAME_MAX_LENGTH} characters."
            )
        object.__setattr__(self, "name", name)
