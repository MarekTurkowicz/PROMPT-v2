from app.access.core.application.authorizer import Authorizer
from app.access.core.application.requires_permission import requires_permission
from app.access.core.domain.enums.permission_enum import PermissionEnum
from app.organization.core.domain.entities.organization import Organization
from app.organization.core.domain.exceptions import TaxIdDuplicationError
from app.organization.core.domain.value_objects.organization_settings import (
    OrganizationSettings,
)
from app.organization.core.domain.value_objects.organization_tax_id import (
    OrganizationTaxId,
)
from app.organization.core.ports.api.commands.create_organization_command import (
    CreateOrganizationCommand,
)
from app.organization.core.ports.api.create_organization_port import (
    CreateOrganizationPort,
)
from app.organization.core.ports.spi.db.repositories.organization_port import (
    OrganizationPort,
)
from app.shared.core.ports.api.actor import Actor


class CreateOrganizationUseCase(CreateOrganizationPort):
    def __init__(self, repository: OrganizationPort, authorizer: Authorizer) -> None:
        self._repository = repository
        self._authorizer = authorizer

    @requires_permission(PermissionEnum.CREATE_ORGANIZATION)
    def execute(self, actor: Actor, command: CreateOrganizationCommand) -> Organization:
        tax_id = OrganizationTaxId(command.tax_id) if command.tax_id is not None else None
        if tax_id is not None and self._repository.exists_by_tax_id(tax_id.value):
            raise TaxIdDuplicationError(tax_id.value)

        organization = Organization(
            id=None,
            name=command.name,
            tax_id=tax_id,
            is_active=True,
            settings=OrganizationSettings(
                timezone=command.timezone,
                currency=command.currency,
                priority_levels=command.priority_levels,
            ),
        )
        return self._repository.create_obj(organization)
