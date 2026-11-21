from app.access.core.domain.enums.permission_enum import PermissionEnum
from app.access.core.domain.exceptions import (
    AccessDeniedError,
    InactiveMembershipError,
    OrganizationAccessNotFoundError,
)
from app.access.core.ports.spi.db.repositories.organization_access_port import (
    OrganizationAccessPort,
)
from app.shared.core.ports.api.actor import Actor


class Authorizer:
    def __init__(self, access_repository: OrganizationAccessPort) -> None:
        self._access_repository = access_repository

    def authorize(self, actor: Actor, permission: PermissionEnum, organization_id: int | None) -> None:
        if actor.is_superuser:
            return
        # Permissions come only from organization roles, so use cases outside one are for superusers.
        if organization_id is None:
            raise AccessDeniedError(actor.user_id, permission, organization_id)

        access = self._access_repository.get_organization_access(actor.user_id, organization_id)
        if access is None:
            raise OrganizationAccessNotFoundError(organization_id)
        if not access.is_active_member:
            raise InactiveMembershipError(actor.user_id, organization_id)
        if permission not in access.permissions:
            raise AccessDeniedError(actor.user_id, permission, organization_id)
