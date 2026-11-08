from app.adapter.spi.nonrelational.models.activity_logs import ACTIVITY_LOGS
from app.adapter.spi.nonrelational.models.comments import COMMENTS
from app.adapter.spi.nonrelational.models.expenses import EXPENSES
from app.adapter.spi.nonrelational.models.fundings import FUNDINGS
from app.adapter.spi.nonrelational.models.projects import PROJECTS
from app.adapter.spi.nonrelational.models.tasks import TASKS

EXPECTED_ENTITY_TYPES = [
    "organization",
    "organization_member",
    "member_group",
    "role",
    "role_assignment",
    "task_status",
    "project",
    "milestone",
    "funding",
    "project_funding",
    "task_template",
    "task",
    "task_assignment",
    "time_entry",
    "checklist_item",
    "comment",
    "attachment",
    "expense",
]

EXPECTED_ACTIVITY_ACTIONS = [
    "created",
    "updated",
    "deleted",
    "status_changed",
    "rescheduled",
    "assigned",
    "unassigned",
    "granted",
    "revoked",
    "attached",
    "detached",
    "checked",
    "unchecked",
    "added_to_group",
    "removed_from_group",
    "invited",
    "reminder_sent",
    "moved",
    "hidden",
    "shown",
    "archived",
    "restored",
    "alert_raised",
    "alert_resolved",
]


def test_project_funding_preserves_detached_records_and_has_only_prd_fields() -> None:
    project_properties = PROJECTS.schema["properties"]
    funding_properties = project_properties["fundings"]["items"]["properties"]
    milestone_properties = project_properties["milestones"]["items"]["properties"]

    assert funding_properties["detached_at"] == {"bsonType": ["date", "null"]}
    assert "allocated_amount" not in funding_properties
    assert "start_date" not in milestone_properties


def test_funding_can_be_shared_without_an_organization() -> None:
    organization_id = FUNDINGS.schema["properties"]["organization_id"]

    assert organization_id["bsonType"] == ["long", "null"]
    assert "organization_id" not in FUNDINGS.schema["required"]


def test_task_always_belongs_to_project_without_direct_funding_reference() -> None:
    task_properties = TASKS.schema["properties"]

    assert task_properties["project_id"] == {"bsonType": "long"}
    assert "project_id" in TASKS.schema["required"]
    assert "funding_id" not in task_properties
    assert "oneOf" not in TASKS.schema


def test_checklist_item_does_not_add_an_assignee_absent_from_prd() -> None:
    checklist_properties = TASKS.schema["properties"]["checklist"]["items"]["properties"]

    assert "assignee_id" not in checklist_properties


def test_activity_log_dictionaries_match_relational_model() -> None:
    properties = ACTIVITY_LOGS.schema["properties"]

    assert properties["entity_type"]["enum"] == EXPECTED_ENTITY_TYPES
    assert properties["action"]["enum"] == EXPECTED_ACTIVITY_ACTIONS


def test_diagram_only_versions_are_not_part_of_prd_schema() -> None:
    assert "version" not in COMMENTS.schema["properties"]
    assert "version" not in EXPENSES.schema["properties"]
