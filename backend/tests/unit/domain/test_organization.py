import pytest

from app.domain.entities.organization import MAX_STATUSES, Organization, Role, parse_permissions
from app.domain.entities.task_status import TaskStatus
from app.domain.enums import BuiltinRoleCode, Permission, StatusCategory
from app.domain.exceptions import (
    BuiltinRoleNotDeletableError,
    DuplicateError,
    FieldImmutableError,
    FieldRequiredError,
    InvalidChoiceError,
    MultipleDefaultStatusesError,
    NotFoundError,
    TooManyItemsError,
    ValidationError,
)
from app.domain.value_objects import OrganizationSettings

SETTINGS = OrganizationSettings.from_dict(
    {
        "timezone": "Europe/Warsaw",
        "currency": "PLN",
        "priority_names": ["Lowest", "Low", "Medium", "High", "Highest"],
    }
)


def status(
    status_id: int | None,
    name: str,
    category: StatusCategory = StatusCategory.TODO,
    *,
    is_default: bool = False,
) -> TaskStatus:
    return TaskStatus(id=status_id, category=category, name=name, is_default=is_default)


def organization(
    statuses: tuple[TaskStatus, ...] = (), roles: tuple[Role, ...] = ()
) -> Organization:
    return Organization(id=1, name="Fundacja", settings=SETTINGS, statuses=statuses, roles=roles)


ADMIN = Role(
    id=10,
    name="Administrator organizacji",
    permissions=frozenset({Permission.MEMBER_MANAGE}),
    code=BuiltinRoleCode.ORGANIZATION_ADMIN,
)
AUDITOR = Role(id=11, name="Audytor", permissions=frozenset({Permission.BUDGET_VIEW}))


def test_name_is_required() -> None:
    with pytest.raises(FieldRequiredError) as error:
        Organization(id=None, name="  ", settings=SETTINGS)

    assert error.value.extra["field"] == "organization.name"


def test_blank_tax_id_is_stored_as_none() -> None:
    org = Organization(id=None, name=" Fundacja ", settings=SETTINGS, tax_id=" ")

    assert org.name == "Fundacja"
    assert org.tax_id is None


def test_rename_validates_the_name() -> None:
    org = organization()

    with pytest.raises(ValidationError):
        org.rename("x" * 201)
    org.rename("Nowa nazwa")

    assert org.name == "Nowa nazwa"


def test_status_category_outside_the_list_is_rejected() -> None:
    # PRD 1.1 TaskStatus AK1
    with pytest.raises(InvalidChoiceError) as error:
        TaskStatus(id=None, category="blocked", name="Zablokowane")  # type: ignore[arg-type]

    assert error.value.extra["field"] == "status.category"


@pytest.mark.parametrize("color", ["red", "#12345", "#GGGGGG"])
def test_status_color_must_be_hex(color: str) -> None:
    with pytest.raises(ValidationError):
        TaskStatus(id=None, category=StatusCategory.TODO, name="Nowe", color=color)


def test_two_statuses_with_the_same_name_are_rejected() -> None:
    # PRD 1.1 TaskStatus AK2
    org = organization(statuses=(status(1, "Do zrobienia"),))

    with pytest.raises(DuplicateError, match="status.name"):
        org.add_status(status(None, " Do zrobienia ", StatusCategory.IN_PROGRESS))

    assert len(org.statuses) == 1


def test_renaming_a_status_to_a_taken_name_is_rejected() -> None:
    # PRD 1.1 TaskStatus AK2
    org = organization(statuses=(status(1, "Do zrobienia"), status(2, "Pilne")))

    with pytest.raises(DuplicateError, match="status.name"):
        org.update_status(status(2, "Do zrobienia"))

    assert org.get_status(2).name == "Pilne"


def test_loading_statuses_with_the_same_name_is_rejected() -> None:
    with pytest.raises(ValidationError):
        organization(statuses=(status(1, "Nowe"), status(2, "Nowe")))


def test_a_second_default_status_is_rejected() -> None:
    # PRD 1.1 TaskStatus AK3
    org = organization(statuses=(status(1, "Do zrobienia", is_default=True), status(2, "Pilne")))

    with pytest.raises(MultipleDefaultStatusesError):
        org.add_status(status(None, "Nowe", is_default=True))

    with pytest.raises(MultipleDefaultStatusesError):
        org.update_status(status(2, "Pilne", is_default=True))


def test_the_default_status_can_be_moved() -> None:
    org = organization(statuses=(status(1, "Do zrobienia", is_default=True), status(2, "Pilne")))

    org.update_status(status(1, "Do zrobienia"))
    org.update_status(status(2, "Pilne", is_default=True))

    assert org.default_status == org.get_status(2)


def test_status_category_cannot_change() -> None:
    org = organization(statuses=(status(1, "Do zrobienia"),))

    with pytest.raises(FieldImmutableError, match="status.category"):
        org.update_status(status(1, "Do zrobienia", StatusCategory.DONE))

    assert org.get_status(1).category is StatusCategory.TODO


def test_status_name_color_and_position_can_change() -> None:
    org = organization(statuses=(status(1, "Do zrobienia"),))
    changed = TaskStatus(
        id=1, category=StatusCategory.TODO, name="Backlog", color="#000000", position=3
    )

    org.update_status(changed)

    assert org.get_status(1) == changed


def test_status_can_be_removed() -> None:
    org = organization(statuses=(status(1, "Do zrobienia"), status(2, "Pilne")))

    org.remove_status(1)

    assert [s.id for s in org.statuses] == [2]


def test_unknown_or_unsaved_status_is_not_found() -> None:
    org = organization(statuses=(status(1, "Do zrobienia"), status(None, "Nowe")))

    with pytest.raises(NotFoundError):
        org.get_status(99)
    with pytest.raises(NotFoundError):
        org.update_status(status(None, "Nowe"))
    with pytest.raises(NotFoundError):
        org.remove_status(99)


def test_number_of_statuses_is_bounded() -> None:
    org = organization(statuses=tuple(status(i, f"S{i}") for i in range(MAX_STATUSES)))

    with pytest.raises(TooManyItemsError) as error:
        org.add_status(status(None, "Jeden za dużo"))

    assert error.value.extra["field"] == "organization.statuses"


def test_two_roles_with_the_same_name_are_rejected() -> None:
    # PRD 1.1 Role AK1
    org = organization(roles=(AUDITOR,))

    with pytest.raises(DuplicateError, match="role.name"):
        org.add_role(Role(id=None, name="Audytor"))


def test_renaming_a_role_to_a_taken_name_is_rejected() -> None:
    # PRD 1.1 Role AK1
    org = organization(roles=(ADMIN, AUDITOR))

    with pytest.raises(DuplicateError, match="role.name"):
        org.update_role(Role(id=11, name=ADMIN.name))


def test_permission_outside_the_catalog_is_rejected() -> None:
    # PRD 1.1 Role AK2
    with pytest.raises(InvalidChoiceError) as error:
        Role(id=None, name="Hacker", permissions=frozenset({"system.root"}))  # type: ignore[arg-type]

    assert error.value.extra["field"] == "role.permission"


def test_permission_codes_from_a_store_are_parsed() -> None:
    # PRD 1.1 Role AK2
    assert parse_permissions(["task.view", "time.log"]) == {
        Permission.TASK_VIEW,
        Permission.TIME_LOG,
    }
    with pytest.raises(ValidationError):
        parse_permissions(["task.view", "task.fly"])


def test_unknown_role_code_is_rejected() -> None:
    with pytest.raises(InvalidChoiceError) as error:
        Role(id=None, name="Szef", code="boss")  # type: ignore[arg-type]

    assert error.value.extra["field"] == "role.code"


def test_two_roles_with_the_same_code_are_rejected() -> None:
    org = organization(roles=(ADMIN,))

    with pytest.raises(DuplicateError, match="role.code"):
        org.add_role(Role(id=None, name="Drugi admin", code=BuiltinRoleCode.ORGANIZATION_ADMIN))


@pytest.mark.parametrize("code", [None, BuiltinRoleCode.VIEWER])
def test_builtin_role_code_never_changes(code: BuiltinRoleCode | None) -> None:
    org = organization(roles=(ADMIN,))

    with pytest.raises(FieldImmutableError, match="role.code"):
        org.update_role(
            Role(id=ADMIN.id, name=ADMIN.name, permissions=ADMIN.permissions, code=code)
        )

    assert org.get_role(10).code is BuiltinRoleCode.ORGANIZATION_ADMIN


def test_custom_role_cannot_become_builtin() -> None:
    org = organization(roles=(AUDITOR,))

    with pytest.raises(FieldImmutableError, match="role.code"):
        org.update_role(Role(id=11, name="Audytor", code=BuiltinRoleCode.VIEWER))


def test_builtin_role_name_and_permissions_can_change() -> None:
    org = organization(roles=(ADMIN,))
    changed = Role(
        id=10,
        name="Admin",
        permissions=frozenset({Permission.MEMBER_MANAGE, Permission.ORG_SETTINGS}),
        code=BuiltinRoleCode.ORGANIZATION_ADMIN,
    )

    org.update_role(changed)

    assert org.get_role(10) == changed


def test_builtin_role_cannot_be_deleted() -> None:
    org = organization(roles=(ADMIN, AUDITOR))

    with pytest.raises(BuiltinRoleNotDeletableError):
        org.remove_role(10)

    assert org.roles == (ADMIN, AUDITOR)


def test_custom_role_can_be_deleted() -> None:
    org = organization(roles=(ADMIN, AUDITOR))

    org.remove_role(11)

    assert org.roles == (ADMIN,)


def test_unknown_role_is_not_found() -> None:
    org = organization(roles=(ADMIN,))

    with pytest.raises(NotFoundError):
        org.remove_role(99)
