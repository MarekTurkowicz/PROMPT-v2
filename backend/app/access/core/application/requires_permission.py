from collections.abc import Callable
from functools import wraps
from typing import Any, Protocol, TypeVar, cast

from app.access.core.application.authorizer import Authorizer
from app.access.core.domain.enums.permission_enum import PermissionEnum
from app.shared.core.ports.api.actor import Actor
from app.shared.core.ports.api.organization_scoped_command import (
    OrganizationScopedCommand,
)

REQUIRED_PERMISSION_ATTRIBUTE = "__required_permission__"


class AuthorizedUseCase(Protocol):
    _authorizer: Authorizer


# Returning ExecuteT unchanged keeps the parameter names, so the use case still matches its inbound port.
ExecuteT = TypeVar("ExecuteT", bound=Callable[..., Any])


def requires_permission(permission: PermissionEnum) -> Callable[[ExecuteT], ExecuteT]:
    def decorator(execute: ExecuteT) -> ExecuteT:
        @wraps(execute)
        def wrapper(self: AuthorizedUseCase, actor: Actor, command: object) -> Any:
            organization_id = (
                command.organization_id if isinstance(command, OrganizationScopedCommand) else None
            )
            self._authorizer.authorize(actor, permission, organization_id)
            return execute(self, actor, command)

        setattr(wrapper, REQUIRED_PERMISSION_ATTRIBUTE, permission)
        return cast(ExecuteT, wrapper)

    return decorator


def get_required_permission(execute: object) -> PermissionEnum | None:
    permission = getattr(execute, REQUIRED_PERMISSION_ATTRIBUTE, None)
    return permission if isinstance(permission, PermissionEnum) else None
