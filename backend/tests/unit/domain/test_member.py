from datetime import UTC, datetime

import pytest

from app.domain.entities.member import Member, MemberProfile
from app.domain.entities.role_grant import RoleGrant
from app.domain.enums import MemberStatus
from app.domain.exceptions import (
    DuplicateError,
    FieldRequiredError,
    FieldTooLongError,
    InvalidChoiceError,
    MemberStatusTransitionInvalidError,
    NotFoundError,
)

INVITED_AT = datetime(2026, 11, 2, 9, 0, tzinfo=UTC)
JOINED_AT = datetime(2026, 11, 3, 12, 30, tzinfo=UTC)


def invited() -> Member:
    return Member.invite(organization_id=1, user_id=7, now=INVITED_AT)


def active() -> Member:
    member = invited()
    member.activate(JOINED_AT)
    return member


def test_invitation_creates_an_invited_member_dated_now() -> None:
    member = invited()

    assert member.status is MemberStatus.INVITED
    assert member.created_at == INVITED_AT
    assert member.joined_at is None


def test_activate_sets_status_and_joined_at() -> None:
    # PRD 1.1 OrganizationMember AK3
    member = invited()

    member.activate(JOINED_AT)

    assert member.status is MemberStatus.ACTIVE
    assert member.joined_at == JOINED_AT


def test_activate_without_a_date_uses_the_current_time() -> None:
    member = invited()

    member.activate()

    assert member.joined_at is not None
    assert member.joined_at.tzinfo is UTC


@pytest.mark.parametrize("end", ["suspend", "leave"])
def test_active_member_can_be_suspended_or_leave(end: str) -> None:
    member = active()

    getattr(member, end)()

    assert member.status is {"suspend": MemberStatus.SUSPENDED, "leave": MemberStatus.LEFT}[end]


def test_reactivation_after_suspension_keeps_joined_at() -> None:
    member = active()
    member.suspend()

    member.activate(datetime(2027, 1, 1, tzinfo=UTC))

    assert member.status is MemberStatus.ACTIVE
    assert member.joined_at == JOINED_AT


@pytest.mark.parametrize(
    ("start", "change"),
    [
        (MemberStatus.INVITED, "suspend"),
        (MemberStatus.INVITED, "leave"),
        (MemberStatus.ACTIVE, "activate"),
        (MemberStatus.SUSPENDED, "suspend"),
        (MemberStatus.LEFT, "activate"),
        (MemberStatus.LEFT, "suspend"),
        (MemberStatus.LEFT, "leave"),
    ],
)
def test_status_transition_outside_the_flow_is_rejected(start: MemberStatus, change: str) -> None:
    member = Member(
        id=3,
        organization_id=1,
        user_id=7,
        status=start,
        joined_at=None if start is MemberStatus.INVITED else JOINED_AT,
    )

    with pytest.raises(MemberStatusTransitionInvalidError):
        getattr(member, change)()

    assert member.status is start


def test_status_outside_the_list_is_rejected() -> None:
    with pytest.raises(InvalidChoiceError) as error:
        Member(id=None, organization_id=1, user_id=7, status="banned")  # type: ignore[arg-type]

    assert error.value.extra["field"] == "member.status"


def test_active_member_without_joined_at_is_rejected() -> None:
    with pytest.raises(FieldRequiredError, match="joined_at"):
        Member(id=3, organization_id=1, user_id=7, status=MemberStatus.ACTIVE)


def test_profile_stores_blank_values_as_none() -> None:
    profile = MemberProfile(email=" jan@fundacja.pl ", phone="", job_title="  ")

    assert profile == MemberProfile(email="jan@fundacja.pl")


def test_profile_value_must_fit_the_column() -> None:
    with pytest.raises(FieldTooLongError) as error:
        MemberProfile(phone="1" * 33)

    assert error.value.extra["field"] == "member.phone"


def test_member_is_added_to_a_group_once() -> None:
    member = active()
    member.add_to_group(5, JOINED_AT)

    with pytest.raises(DuplicateError, match="member.groups"):
        member.add_to_group(5)

    assert [membership.group_id for membership in member.groups] == [5]


def test_member_is_removed_from_a_group() -> None:
    member = active()
    member.add_to_group(5)
    member.add_to_group(6)

    member.remove_from_group(5)

    assert [membership.group_id for membership in member.groups] == [6]
    with pytest.raises(NotFoundError):
        member.remove_from_group(5)


@pytest.mark.parametrize("project_id", [None, 40])
def test_duplicate_role_grant_is_rejected(project_id: int | None) -> None:
    # PRD 1.1 RoleAssignment AK2 – the same role, member and project, also with no project
    member = active()
    member.grant_role(20, project_id)

    with pytest.raises(DuplicateError, match="member.role_grants "):
        member.grant_role(20, project_id)

    assert len(member.role_grants) == 1


def test_loading_duplicate_role_grants_is_rejected() -> None:
    # PRD 1.1 RoleAssignment AK2
    with pytest.raises(DuplicateError, match="member.role_grants "):
        Member(
            id=3,
            organization_id=1,
            user_id=7,
            role_grants=(RoleGrant(id=1, role_id=20), RoleGrant(id=2, role_id=20)),
        )


def test_the_same_role_can_be_granted_in_the_organization_and_in_projects() -> None:
    member = active()

    member.grant_role(20)
    member.grant_role(20, project_id=40)
    member.grant_role(20, project_id=41)

    assert {(g.role_id, g.project_id) for g in member.role_grants} == {
        (20, None),
        (20, 40),
        (20, 41),
    }


def test_role_grant_is_revoked_only_in_its_scope() -> None:
    member = active()
    member.grant_role(20)
    member.grant_role(20, project_id=40)

    member.revoke_role(20, project_id=40)

    assert [(g.role_id, g.project_id) for g in member.role_grants] == [(20, None)]
    with pytest.raises(NotFoundError):
        member.revoke_role(20, project_id=40)
