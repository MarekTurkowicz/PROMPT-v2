from dataclasses import replace
from typing import TypeGuard

from app.oganization.core.ports.api.commands.update_organization_settings_command import (
    UNSET,
    UpdateOrganizationSettingsCommand,
)
from app.oganization.core.domain.entities.organization import Organization
from app.oganization.core.domain.exceptions import OrganizationNotFound
from app.oganization.core.domain.value_objects.organization_settings import (
    OrganizationSettings,
)
from app.oganization.core.ports.api.update_organization_settings_port import (
    UpdateOrganizationSettingsPort,
)
from app.oganization.core.ports.spi.db.repositories.organization_port import (
    OrganizationPort,
)


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
                    current.timezone if command.timezone is UNSET else command.timezone
                ),
                currency=(
                    current.currency if command.currency is UNSET else command.currency
                ),
                priority_levels=(
                    current.priority_levels
                    if command.priority_levels is UNSET
                    else command.priority_levels
                ),
            ),
        )
        return self._repository.update_obj(updated)

    @staticmethod
    def _is_set(value: T | Unset) -> TypeGuard[T]:
        return value is not UNSET
