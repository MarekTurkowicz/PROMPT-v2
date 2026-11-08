from app.oganization.adapter.outbound.relational_db.organization_repository import (
    OrganizationRepository,
)
from app.oganization.core.application.create_organization_use_case import (
    CreateOrganizationUseCase,
)


class DependenciesContainer:
    create_organization: CreateOrganizationUseCase

    def __init__(self) -> None:
        self.build()

    def build(self) -> None:
        self.create_organization = CreateOrganizationUseCase(
            repository=OrganizationRepository(),
        )
