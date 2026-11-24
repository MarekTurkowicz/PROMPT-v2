import ast
from pathlib import Path

import pytest

from app.activity.adapter.outbound.relational_db.models import activity_log as relational_activity_log
from app.activity.core.domain.enums.activity_action import ActivityAction
from app.activity.core.domain.enums.entity_type import EntityType
from app.object_relational_schema import SCHEMA_OBJECTS
from app.shared.adapter.outbound.object_relational_db.objects import (
    EnumType,
    Table,
    missing_dependencies,
)

BACKEND = Path(__file__).resolve().parents[3]
ENUMS = {obj.name: obj for obj in SCHEMA_OBJECTS if isinstance(obj, EnumType)}

# ENUM -> (relational model file, TextChoices class). The api models are not installed,
# so the values are read from the source instead of importing the module.
RELATIONAL_CHOICES = {
    "member_status_t": (
        "app/organization/adapter/outbound/relational_db/models/organization_member.py",
        "MemberStatus",
    ),
    "project_status_t": ("api/models/project.py", "ProjectStatus"),
    "status_category_t": ("api/models/task_status.py", "StatusCategory"),
    "milestone_status_t": ("api/models/milestone.py", "MilestoneStatus"),
    "funding_type_t": ("api/models/funding.py", "FundingType"),
    "expense_type_t": ("api/models/expense.py", "ExpenseType"),
}

# ENUM -> the domain enum the relational model takes its values from.
RELATIONAL_DOMAIN_ENUMS = {
    "entity_type_t": (relational_activity_log.ENTITY_TYPES, EntityType),
    "activity_action_t": (relational_activity_log.ACTIONS, ActivityAction),
}


def text_choices_values(path: str, class_name: str) -> tuple[str, ...]:
    tree = ast.parse((BACKEND / path).read_text(encoding="utf-8"))
    cls = next(n for n in ast.walk(tree) if isinstance(n, ast.ClassDef) and n.name == class_name)
    values = []
    for node in cls.body:
        if isinstance(node, ast.Assign) and isinstance(node.value, ast.Tuple):
            first = node.value.elts[0]
            assert isinstance(first, ast.Constant)
            values.append(str(first.value))
    return tuple(values)


def test_every_enum_is_checked() -> None:
    assert set(ENUMS) == set(RELATIONAL_CHOICES) | set(RELATIONAL_DOMAIN_ENUMS)


@pytest.mark.parametrize("enum_name", sorted(RELATIONAL_CHOICES))
def test_enum_values_match_relational_choices(enum_name: str) -> None:
    # Same order too: PostgreSQL compares ENUM values by their position.
    assert ENUMS[enum_name].values == text_choices_values(*RELATIONAL_CHOICES[enum_name])


@pytest.mark.parametrize("enum_name", sorted(RELATIONAL_DOMAIN_ENUMS))
def test_enum_values_come_from_the_same_domain_enum(enum_name: str) -> None:
    relational_values, domain_enum = RELATIONAL_DOMAIN_ENUMS[enum_name]
    domain_values = tuple(member.value for member in domain_enum)

    assert ENUMS[enum_name].values == domain_values
    assert tuple(relational_values) == domain_values


def test_schema_has_no_missing_dependencies() -> None:
    assert missing_dependencies(SCHEMA_OBJECTS) == []


def test_schema_has_twenty_tables() -> None:
    assert len([obj for obj in SCHEMA_OBJECTS if isinstance(obj, Table)]) == 20


def test_object_names_are_unique() -> None:
    names = [obj.name for obj in SCHEMA_OBJECTS]
    assert len(names) == len(set(names))
