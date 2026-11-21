from typing import Protocol

from app.organization.core.domain.entities.organization import Organization
from app.organization.core.ports.api.commands.create_organization_command import (
    CreateOrganizationCommand,
)
from app.shared.core.ports.api.actor import Actor


class CreateOrganizationPort(Protocol):
    def execute(self, actor: Actor, command: CreateOrganizationCommand) -> Organization: ...
