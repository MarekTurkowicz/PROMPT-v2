from typing import Protocol

from app.organization.core.domain.entities.organization_member import (
    OrganizationMember,
)


class OrganizationMemberPort(Protocol):
    def exists(self, organization_id: int, user_id: int) -> bool: ...
    def create_obj(self, member_entity: OrganizationMember) -> OrganizationMember: ...
