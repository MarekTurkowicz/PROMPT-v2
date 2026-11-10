from app.organization.core.ports.api.commands.create_organization_command import (
    CreateOrganizationCommand,
)
from app.organization.core.domain.entities.organization import Organization
from app.organization.core.domain.exceptions import TaxIdDuplicationException
from app.organization.core.domain.value_objects.organization_settings import (
    OrganizationSettings,
)
from app.organization.core.domain.value_objects.organization_tax_id import (
    OrganizationTaxId,
)
from app.organization.core.ports.api.create_organization_port import (
    CreateOrganizationPort,
)
from app.organization.core.ports.spi.db.repositories.organization_port import (
    OrganizationPort,
)


class CreateOrganizationUseCase(CreateOrganizationPort):
    def __init__(self, repository: OrganizationPort) -> None:
        self._repository = repository

    def execute(self, command: CreateOrganizationCommand) -> Organization:
        tax_id = (
            OrganizationTaxId(command.tax_id) if command.tax_id is not None else None
        )
        if tax_id is not None and self._repository.exists_by_tax_id(tax_id.value):
            raise TaxIdDuplicationException(tax_id.value)

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
