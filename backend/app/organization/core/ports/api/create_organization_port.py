from typing import Protocol

from app.organization.core.ports.api.commands.create_organization_command import (
    CreateOrganizationCommand,
)
from app.organization.core.domain.entities.organization import Organization


class CreateOrganizationPort(Protocol):
    def execute(self, command: CreateOrganizationCommand) -> Organization: ...
