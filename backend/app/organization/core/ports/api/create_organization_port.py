from typing import Protocol

from app.oganization.core.ports.api.commands.create_organization_command import (
    CreateOrganizationCommand,
)
from app.oganization.core.domain.entities.organization import Organization


class CreateOrganizationPort(Protocol):
    def execute(self, command: CreateOrganizationCommand) -> Organization: ...
