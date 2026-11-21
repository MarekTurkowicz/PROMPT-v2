from typing import Protocol

from app.access.core.domain.entities.organization_access import OrganizationAccess


class OrganizationAccessPort(Protocol):
    def get_organization_access(self, user_id: int, organization_id: int) -> OrganizationAccess | None:
        """Return None when the organization does not exist, is inactive, or the user is not its member."""
