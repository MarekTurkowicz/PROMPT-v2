from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime

from app.domain.exceptions import NotFoundError
from app.domain.validation import ensure_at_most, ensure_unique


@dataclass(frozen=True)
class RoleGrant:
    """
    ``project_id`` ``None`` = organization-wide. The grantee is the aggregate holding the grant
    (``Member`` or ``Group``), so "exactly one of member or group" holds by construction.
    """

    id: int | None
    role_id: int
    project_id: int | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


def check_role_grants(grants: Sequence[RoleGrant], *, limit: int, field: str) -> None:
    ensure_at_most(grants, limit, field=field)
    ensure_unique((grant.id for grant in grants if grant.id is not None), field=f"{field}.id")
    ensure_unique(((grant.role_id, grant.project_id) for grant in grants), field=field)


def add_role_grant(
    grants: tuple[RoleGrant, ...], grant: RoleGrant, *, limit: int, field: str
) -> tuple[RoleGrant, ...]:
    updated = (*grants, grant)
    check_role_grants(updated, limit=limit, field=field)
    return updated


def remove_role_grant(
    grants: tuple[RoleGrant, ...], role_id: int, project_id: int | None
) -> tuple[RoleGrant, ...]:
    remaining = tuple(
        grant for grant in grants if (grant.role_id, grant.project_id) != (role_id, project_id)
    )
    if len(remaining) == len(grants):
        raise NotFoundError(
            "role grant not found.",
            extra={"entity": "role_grant", "role_id": role_id, "project_id": project_id},
        )
    return remaining
