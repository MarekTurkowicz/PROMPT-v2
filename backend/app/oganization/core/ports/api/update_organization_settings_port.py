from typing import Protocol

from app.oganization.core.ports.api.commands.update_organization_settings_command import (
    UpdateOrganizationSettingsCommand,
)
from app.oganization.core.domain.entities.organization import Organization


class UpdateOrganizationSettingsPort(Protocol):
    def execute(self, command: UpdateOrganizationSettingsCommand) -> Organization: ...
