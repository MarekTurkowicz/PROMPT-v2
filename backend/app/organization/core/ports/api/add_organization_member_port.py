from typing import Protocol

from app.organization.core.domain.entities.organization_member import (
    OrganizationMember,
)
from app.organization.core.ports.api.commands.add_organization_member_command import (
    AddOrganizationMemberCommand,
)


class AddOrganizationMemberPort(Protocol):
    def execute(self, command: AddOrganizationMemberCommand) -> OrganizationMember: ...
