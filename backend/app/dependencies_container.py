from typing import Any

from app.activity.adapter.outbound.relational_db.repositories.notification_repository import (
    NotificationRepository,
)
from app.activity.core.ports.spi.db.repositories.notification_port import (
    NotificationPort,
)
from app.organization.adapter.outbound.relational_db.repositories.organization_member_repository import (
    OrganizationMemberRepository,
)
from app.organization.adapter.outbound.relational_db.repositories.organization_repository import (
    OrganizationRepository,
)
from app.organization.adapter.outbound.relational_db.repositories.user_repository import (
    UserRepository,
)
from app.organization.core.application.add_organization_member_use_case import (
    AddOrganizationMemberUseCase,
)
from app.organization.core.application.create_organization_use_case import (
    CreateOrganizationUseCase,
)
from app.organization.core.application.update_organization_settings_use_case import (
    UpdateOrganizationSettingsUseCase,
)
from app.organization.core.ports.api.add_organization_member_port import (
    AddOrganizationMemberPort,
)
from app.organization.core.ports.api.create_organization_port import (
    CreateOrganizationPort,
)
from app.organization.core.ports.api.update_organization_settings_port import (
    UpdateOrganizationSettingsPort,
)
from app.organization.core.ports.spi.db.repositories.organization_member_port import (
    OrganizationMemberPort,
)
from app.organization.core.ports.spi.db.repositories.organization_port import (
    OrganizationPort,
)
from app.organization.core.ports.spi.db.repositories.user_port import UserPort

RELATIONAL_DB_REPOSITORIES: dict[type, type] = {
    OrganizationPort: OrganizationRepository,
    OrganizationMemberPort: OrganizationMemberRepository,
    UserPort: UserRepository,
    NotificationPort: NotificationRepository,
}


# TODO Na szybko miałem problem żeby typowanie ogarnąć więc do przekminki
class DependenciesContainer:
    create_organization: CreateOrganizationPort
    update_organization_settings: UpdateOrganizationSettingsPort
    add_organization_member: AddOrganizationMemberPort
    repositories: dict[type, Any]

    def __init__(self) -> None:
        self._create_repositories()
        self._build()

    def _create_repositories(self) -> None:
        self.repositories = {
            port: repository()
            for port, repository in RELATIONAL_DB_REPOSITORIES.items()
        }

    def _build(self) -> None:
        self.create_organization = CreateOrganizationUseCase(
            repository=self.repositories[OrganizationPort]
        )
        self.update_organization_settings = UpdateOrganizationSettingsUseCase(
            repository=self.repositories[OrganizationPort],
        )
        self.add_organization_member = AddOrganizationMemberUseCase(
            organization_repository=self.repositories[OrganizationPort],
            member_repository=self.repositories[OrganizationMemberPort],
            user_repository=self.repositories[UserPort],
            notification_repository=self.repositories[NotificationPort],
        )
