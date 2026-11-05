from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.domain.value_objects.organization_settings import OrganizationSettings


@dataclass
class Organization:
    id: UUID | None
    name: str
    tax_id: str | None
    is_active: bool
    settings: OrganizationSettings
    created_at: datetime | None = None
    modified_at: datetime | None = None
