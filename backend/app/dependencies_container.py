from app.oganization.adapter.outbound.relational_db.organization_repository import (
    OrganizationRepository,
)
from app.oganization.core.application.create_organization_use_case import (
    CreateOrganizationUseCase,
)
from app.oganization.core.application.update_organization_settings_use_case import (
    UpdateOrganizationSettingsUseCase,
)
from app.oganization.core.ports.api.create_organization_port import (
    CreateOrganizationPort,
)
from app.oganization.core.ports.api.update_organization_settings_port import (
    UpdateOrganizationSettingsPort,
)


class DependenciesContainer:
    create_organization: CreateOrganizationPort
    update_organization_settings: UpdateOrganizationSettingsPort

    def __init__(self) -> None:
        self.build()

    def build(self) -> None:
        repository = OrganizationRepository()
        self.create_organization = CreateOrganizationUseCase(repository=repository)
        self.update_organization_settings = UpdateOrganizationSettingsUseCase(
            repository=repository,
        )
