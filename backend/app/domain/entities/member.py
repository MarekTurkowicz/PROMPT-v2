from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Self

from app.domain.entities.role_grant import (
    RoleGrant,
    add_role_grant,
    check_role_grants,
    remove_role_grant,
)
from app.domain.enums import MemberStatus
from app.domain.exceptions import (
    FieldRequiredError,
    MemberStatusTransitionInvalidError,
    NotFoundError,
)
from app.domain.validation import ensure_at_most, ensure_unique, optional_text, parse_choice

MAX_GROUPS = 50
MAX_ROLE_GRANTS = 100

_TRANSITIONS: dict[MemberStatus, frozenset[MemberStatus]] = {
    MemberStatus.INVITED: frozenset({MemberStatus.ACTIVE}),
    MemberStatus.ACTIVE: frozenset({MemberStatus.SUSPENDED, MemberStatus.LEFT}),
    MemberStatus.SUSPENDED: frozenset({MemberStatus.ACTIVE, MemberStatus.LEFT}),
    MemberStatus.LEFT: frozenset(),
}


@dataclass(frozen=True)
class MemberProfile:
    email: str | None = None
    phone: str | None = None
    job_title: str | None = None
    avatar_url: str | None = None

    def __post_init__(self) -> None:
        for name, max_length in (
            ("email", 254),
            ("phone", 32),
            ("job_title", 120),
            ("avatar_url", 500),
        ):
            value = optional_text(
                getattr(self, name), field=f"member.{name}", max_length=max_length
            )
            object.__setattr__(self, name, value)


@dataclass(frozen=True)
class GroupMembership:
    group_id: int
    added_at: datetime | None = None


@dataclass
class Member:
    """
    ``created_at`` is the invitation date (Z10); ``version`` is changed only by adapters (Z13).
    Rules spanning aggregates (last administrator, same organization) belong to the services.
    """

    id: int | None
    organization_id: int
    user_id: int
    status: MemberStatus = MemberStatus.INVITED
    profile: MemberProfile = field(default_factory=MemberProfile)
    created_at: datetime | None = None
    joined_at: datetime | None = None
    groups: tuple[GroupMembership, ...] = ()
    role_grants: tuple[RoleGrant, ...] = ()
    version: int = 0

    def __post_init__(self) -> None:
        self.status = parse_choice(MemberStatus, self.status, field="member.status")
        if self.status is MemberStatus.ACTIVE and self.joined_at is None:
            raise FieldRequiredError(
                "An active member must have joined_at.", extra={"field": "member.joined_at"}
            )
        _check_groups(self.groups)
        check_role_grants(self.role_grants, limit=MAX_ROLE_GRANTS, field="member.role_grants")

    @classmethod
    def invite(
        cls,
        *,
        organization_id: int,
        user_id: int,
        profile: MemberProfile | None = None,
        now: datetime | None = None,
    ) -> Self:
        return cls(
            id=None,
            organization_id=organization_id,
            user_id=user_id,
            profile=profile or MemberProfile(),
            created_at=now or _utc_now(),
        )

    def activate(self, now: datetime | None = None) -> None:
        self._change_status(MemberStatus.ACTIVE)
        if self.joined_at is None:
            self.joined_at = now or _utc_now()

    def suspend(self) -> None:
        self._change_status(MemberStatus.SUSPENDED)

    def leave(self) -> None:
        self._change_status(MemberStatus.LEFT)

    def _change_status(self, status: MemberStatus) -> None:
        if status not in _TRANSITIONS[self.status]:
            raise MemberStatusTransitionInvalidError(
                extra={"from": str(self.status), "to": str(status)}
            )
        self.status = status

    def add_to_group(self, group_id: int, now: datetime | None = None) -> None:
        groups = (*self.groups, GroupMembership(group_id, now or _utc_now()))
        _check_groups(groups)
        self.groups = groups

    def remove_from_group(self, group_id: int) -> None:
        groups = tuple(membership for membership in self.groups if membership.group_id != group_id)
        if len(groups) == len(self.groups):
            raise NotFoundError(
                "member is not in this group.", extra={"entity": "group", "id": group_id}
            )
        self.groups = groups

    def grant_role(
        self, role_id: int, project_id: int | None = None, now: datetime | None = None
    ) -> RoleGrant:
        at = now or _utc_now()
        grant = RoleGrant(
            id=None, role_id=role_id, project_id=project_id, created_at=at, updated_at=at
        )
        self.role_grants = add_role_grant(
            self.role_grants, grant, limit=MAX_ROLE_GRANTS, field="member.role_grants"
        )
        return grant

    def revoke_role(self, role_id: int, project_id: int | None = None) -> None:
        self.role_grants = remove_role_grant(self.role_grants, role_id, project_id)


def _check_groups(groups: tuple[GroupMembership, ...]) -> None:
    ensure_at_most(groups, MAX_GROUPS, field="member.groups")
    ensure_unique((membership.group_id for membership in groups), field="member.groups")


def _utc_now() -> datetime:
    return datetime.now(UTC)
