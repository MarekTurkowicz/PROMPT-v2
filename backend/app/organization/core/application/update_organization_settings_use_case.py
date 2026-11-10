from dataclasses import replace

from app.organization.core.ports.api.commands.update_organization_settings_command import (
    UpdateOrganizationSettingsCommand,
)
from app.organization.core.domain.entities.organization import Organization
from app.organization.core.domain.exceptions import OrganizationNotFound
from app.organization.core.domain.value_objects.organization_settings import (
    OrganizationSettings,
)
from app.organization.core.ports.api.update_organization_settings_port import (
    UpdateOrganizationSettingsPort,
)
from app.organization.core.ports.spi.db.repositories.organization_port import (
    OrganizationPort,
)
from app.shared.core.utils import is_not_unset


class UpdateOrganizationSettingsUseCase(UpdateOrganizationSettingsPort):
    def __init__(self, repository: OrganizationPort) -> None:
        self._repository = repository

    def execute(self, command: UpdateOrganizationSettingsCommand) -> Organization:
        organization = self._repository.get_by_id(command.organization_id)
        if organization is None:
            raise OrganizationNotFound(command.organization_id)

        current = organization.settings
        updated = replace(
            organization,
            settings=OrganizationSettings(
                timezone=(
                    command.timezone
                    if is_not_unset(command.timezone)
                    else current.timezone
                ),
                currency=(
                    command.currency
                    if is_not_unset(command.currency)
                    else current.currency
                ),
                priority_levels=(
                    command.priority_levels
                    if is_not_unset(command.priority_levels)
                    else current.priority_levels
                ),
            ),
        )
        return self._repository.update_obj(updated)
