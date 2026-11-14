from typing import Protocol

from app.organization.core.domain.entities.organization import Organization
from app.organization.core.ports.api.commands.create_organization_command import (
    CreateOrganizationCommand,
)


class CreateOrganizationPort(Protocol):
    def execute(self, command: CreateOrganizationCommand) -> Organization: ...
