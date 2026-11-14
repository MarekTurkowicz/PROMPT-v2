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

    # TODO Napisać konstruktor
    # def __init__(self, user_id: int, permission: str, scope: Scope) -> None:
    #     super().__init__(
    #         f"User {user_id} lacks {permission} in {scope}.",
    #         permission=permission,
    #         organization_id=scope.organization_id,
    #         project_id=scope.project_id,
    #     )
