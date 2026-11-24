from app.access.core.domain.enums.permission_enum import PermissionEnum
from app.shared.core.domain.error_kind import ErrorKind
from app.shared.core.domain.exceptions import DomainError


class InvalidCredentialsError(DomainError):
    kind = ErrorKind.NOT_AUTHORIZED
    code = "access.invalid_credentials"

    def __init__(self) -> None:
        super().__init__("Invalid email or password.")


class AccessDeniedError(DomainError):
    kind = ErrorKind.FORBIDDEN
    code = "access.access_denied"

    def __init__(self, user_id: int, permission: PermissionEnum, organization_id: int | None) -> None:
        scope = "the platform" if organization_id is None else f"organization {organization_id}"
        super().__init__(
            f"User {user_id} lacks {permission} in {scope}.",
            permission=permission.value,
            organization_id=organization_id,
        )


class InactiveMembershipError(DomainError):
    kind = ErrorKind.FORBIDDEN
    code = "access.inactive_membership"

    def __init__(self, user_id: int, organization_id: int) -> None:
        super().__init__(
            f"User {user_id} is not an active member of organization {organization_id}.",
            organization_id=organization_id,
        )


class OrganizationAccessNotFoundError(DomainError):
    kind = ErrorKind.NOT_FOUND
    code = "access.organization_not_found"

    def __init__(self, organization_id: int) -> None:
        super().__init__(
            f"Organization {organization_id} does not exist.",
            organization_id=organization_id,
        )
