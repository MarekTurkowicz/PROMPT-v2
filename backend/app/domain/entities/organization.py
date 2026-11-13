from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import datetime

from app.domain.entities.task_status import TaskStatus
from app.domain.enums import BuiltinRoleCode, Permission
from app.domain.exceptions import (
    BuiltinRoleNotDeletableError,
    FieldImmutableError,
    MultipleDefaultStatusesError,
    NotFoundError,
)
from app.domain.validation import (
    ensure_at_most,
    ensure_unique,
    optional_text,
    parse_choice,
    required_text,
)
from app.domain.value_objects import OrganizationSettings

ORGANIZATION_NAME_MAX_LENGTH = 200
TAX_ID_MAX_LENGTH = 20
ROLE_NAME_MAX_LENGTH = 120
MAX_STATUSES = 50
MAX_ROLES = 50


def parse_permissions(codes: Iterable[str]) -> frozenset[Permission]:
    return frozenset(parse_choice(Permission, code, field="role.permission") for code in codes)


@dataclass(frozen=True)
class Role:
    id: int | None
    name: str
    permissions: frozenset[Permission] = frozenset()
    code: BuiltinRoleCode | None = None

    def __post_init__(self) -> None:
        name = required_text(self.name, field="role.name", max_length=ROLE_NAME_MAX_LENGTH)
        object.__setattr__(self, "name", name)
        object.__setattr__(self, "permissions", parse_permissions(self.permissions))
        if self.code is not None:
            code = parse_choice(BuiltinRoleCode, self.code, field="role.code")
            object.__setattr__(self, "code", code)

    @property
    def is_builtin(self) -> bool:
        return self.code is not None


@dataclass
class Organization:
    """``version`` is changed only by adapters (Z13)."""

    id: int | None
    name: str
    settings: OrganizationSettings
    tax_id: str | None = None
    is_active: bool = True
    statuses: tuple[TaskStatus, ...] = ()
    roles: tuple[Role, ...] = ()
    created_at: datetime | None = None
    modified_at: datetime | None = None
    version: int = 0

    def __post_init__(self) -> None:
        self.name = _organization_name(self.name)
        self.tax_id = _tax_id(self.tax_id)
        _check_statuses(self.statuses)
        _check_roles(self.roles)

    def rename(self, name: str) -> None:
        self.name = _organization_name(name)

    def change_tax_id(self, tax_id: str | None) -> None:
        # uniqueness across organizations is checked by the store
        self.tax_id = _tax_id(tax_id)

    @property
    def default_status(self) -> TaskStatus | None:
        return next((status for status in self.statuses if status.is_default), None)

    def get_status(self, status_id: int) -> TaskStatus:
        return self.statuses[_position(self.statuses, status_id, entity="status")]

    def add_status(self, status: TaskStatus) -> None:
        statuses = (*self.statuses, status)
        _check_statuses(statuses)
        self.statuses = statuses

    def update_status(self, status: TaskStatus) -> None:
        index = _position(self.statuses, status.id, entity="status")
        if self.statuses[index].category != status.category:
            raise FieldImmutableError(
                "status.category cannot change.",
                extra={"field": "status.category", "id": status.id},
            )
        statuses = (*self.statuses[:index], status, *self.statuses[index + 1 :])
        _check_statuses(statuses)
        self.statuses = statuses

    def remove_status(self, status_id: int) -> None:
        # whether tasks still use the status is checked by the service
        index = _position(self.statuses, status_id, entity="status")
        self.statuses = (*self.statuses[:index], *self.statuses[index + 1 :])

    def get_role(self, role_id: int) -> Role:
        return self.roles[_position(self.roles, role_id, entity="role")]

    def add_role(self, role: Role) -> None:
        roles = (*self.roles, role)
        _check_roles(roles)
        self.roles = roles

    def update_role(self, role: Role) -> None:
        index = _position(self.roles, role.id, entity="role")
        if self.roles[index].code != role.code:
            raise FieldImmutableError(
                "role.code cannot change.", extra={"field": "role.code", "id": role.id}
            )
        roles = (*self.roles[:index], role, *self.roles[index + 1 :])
        _check_roles(roles)
        self.roles = roles

    def remove_role(self, role_id: int) -> None:
        # the role's grants on members and groups are removed by the service (CASCADE)
        index = _position(self.roles, role_id, entity="role")
        if self.roles[index].is_builtin:
            raise BuiltinRoleNotDeletableError(extra={"id": role_id})
        self.roles = (*self.roles[:index], *self.roles[index + 1 :])


def _organization_name(name: str) -> str:
    return required_text(name, field="organization.name", max_length=ORGANIZATION_NAME_MAX_LENGTH)


def _tax_id(tax_id: str | None) -> str | None:
    return optional_text(tax_id, field="organization.tax_id", max_length=TAX_ID_MAX_LENGTH)


def _position(items: Sequence[TaskStatus | Role], item_id: int | None, *, entity: str) -> int:
    for index, item in enumerate(items):
        if item_id is not None and item.id == item_id:
            return index
    raise NotFoundError(f"{entity} not found.", extra={"entity": entity, "id": item_id})


def _check_statuses(statuses: Sequence[TaskStatus]) -> None:
    ensure_at_most(statuses, MAX_STATUSES, field="organization.statuses")
    ensure_unique((status.id for status in statuses if status.id is not None), field="status.id")
    ensure_unique((status.name for status in statuses), field="status.name")
    if sum(status.is_default for status in statuses) > 1:
        raise MultipleDefaultStatusesError()


def _check_roles(roles: Sequence[Role]) -> None:
    ensure_at_most(roles, MAX_ROLES, field="organization.roles")
    ensure_unique((role.id for role in roles if role.id is not None), field="role.id")
    ensure_unique((role.name for role in roles), field="role.name")
    ensure_unique((role.code for role in roles if role.code is not None), field="role.code")
