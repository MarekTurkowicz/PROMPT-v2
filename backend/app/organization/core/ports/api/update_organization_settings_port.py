from typing import Protocol

from app.organization.core.domain.entities.organization import Organization
from app.organization.core.ports.api.commands.update_organization_settings_command import (
    UpdateOrganizationSettingsCommand,
)


class UpdateOrganizationSettingsPort(Protocol):
    def execute(self, command: UpdateOrganizationSettingsCommand) -> Organization: ...
