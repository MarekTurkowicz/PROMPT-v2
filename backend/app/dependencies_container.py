from typing import Any

from django.core.exceptions import ImproperlyConfigured

from app.access.adapter.outbound.relational_db.repositories.organization_access_repository import (
    OrganizationAccessRepository,
)
from app.access.adapter.outbound.relational_db.repositories.user_repository import (
    UserRepository,
)
from app.access.core.application.authorizer import Authorizer
from app.access.core.application.requires_permission import get_required_permission
from app.access.core.ports.spi.db.repositories.organization_access_port import (
    OrganizationAccessPort,
)
from app.access.core.ports.user_port import UserPort
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

RELATIONAL_DB_REPOSITORIES: dict[type, type] = {
    OrganizationPort: OrganizationRepository,
    OrganizationMemberPort: OrganizationMemberRepository,
    UserPort: UserRepository,
    NotificationPort: NotificationRepository,
    OrganizationAccessPort: OrganizationAccessRepository,
}


# TODO Na szybko miałem problem żeby typowanie ogarnąć więc do przekminki
class DependenciesContainer:
    authorizer: Authorizer
    create_organization: CreateOrganizationPort
    update_organization_settings: UpdateOrganizationSettingsPort
    add_organization_member: AddOrganizationMemberPort
    repositories: dict[type, Any]

    def __init__(self) -> None:
        self._create_repositories()
        self._build()
        self._verify_authorization()

    def _create_repositories(self) -> None:
        self.repositories = {port: repository() for port, repository in RELATIONAL_DB_REPOSITORIES.items()}

    def _build(self) -> None:
        self.authorizer = Authorizer(access_repository=self.repositories[OrganizationAccessPort])
        self.create_organization = CreateOrganizationUseCase(
            repository=self.repositories[OrganizationPort],
            authorizer=self.authorizer,
        )
        self.update_organization_settings = UpdateOrganizationSettingsUseCase(
            repository=self.repositories[OrganizationPort],
            authorizer=self.authorizer,
        )
        self.add_organization_member = AddOrganizationMemberUseCase(
            organization_repository=self.repositories[OrganizationPort],
            member_repository=self.repositories[OrganizationMemberPort],
            user_repository=self.repositories[UserPort],
            notification_repository=self.repositories[NotificationPort],
            authorizer=self.authorizer,
        )

    def _verify_authorization(self) -> None:
        for name, dependency in vars(self).items():
            execute = getattr(type(dependency), "execute", None)
            if execute is None:
                continue
            if get_required_permission(execute) is None:
                raise ImproperlyConfigured(
                    f"Use case '{name}' ({type(dependency).__name__}) must decorate execute with "
                    f"@requires_permission."
                )
            if not isinstance(getattr(dependency, "_authorizer", None), Authorizer):
                raise ImproperlyConfigured(
                    f"Use case '{name}' ({type(dependency).__name__}) must keep the Authorizer in "
                    f"self._authorizer."
                )
