from app.adapter.spi.nonrelational.models import COLLECTIONS
from app.adapter.spi.nonrelational.models.activity_logs import ACTIVITY_LOGS
from app.adapter.spi.nonrelational.models.comments import COMMENTS
from app.adapter.spi.nonrelational.models.counters import COUNTERS
from app.adapter.spi.nonrelational.models.expenses import EXPENSES
from app.adapter.spi.nonrelational.models.fundings import FUNDINGS
from app.adapter.spi.nonrelational.models.groups import GROUPS
from app.adapter.spi.nonrelational.models.notifications import NOTIFICATIONS
from app.adapter.spi.nonrelational.models.projects import PROJECTS
from app.adapter.spi.nonrelational.models.tasks import TASKS
from app.adapter.spi.nonrelational.models.time_entries import TIME_ENTRIES

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
    fundings_schema = project_properties["fundings"]
    funding_properties = fundings_schema["items"]["properties"]
    milestone_properties = project_properties["milestones"]["items"]["properties"]

    assert funding_properties["detached_at"] == {"bsonType": ["date", "null"]}
    assert "allocated_amount" not in funding_properties
    assert "start_date" not in milestone_properties
    assert "maxItems" not in fundings_schema


def test_funding_can_be_shared_without_an_organization() -> None:
    organization_id = FUNDINGS.schema["properties"]["organization_id"]

    assert organization_id["bsonType"] == ["int", "long", "null"]
    assert "organization_id" not in FUNDINGS.schema["required"]


def test_task_template_keeps_prd_mandatory_flag() -> None:
    template_schema = FUNDINGS.schema["properties"]["templates"]["items"]

    assert template_schema["properties"]["mandatory"] == {"bsonType": "bool"}
    assert "mandatory" in template_schema["required"]


def test_task_always_belongs_to_project_without_direct_funding_reference() -> None:
    task_properties = TASKS.schema["properties"]

    assert task_properties["project_id"] == {"bsonType": ["int", "long"]}
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


def test_identifiers_accept_bson_int32_and_int64() -> None:
    assert TASKS.schema["properties"]["_id"]["bsonType"] == ["int", "long"]
    assert TASKS.schema["properties"]["parent_id"]["bsonType"] == [
        "int",
        "long",
        "null",
    ]
    assert COUNTERS.schema["properties"]["seq"]["bsonType"] == ["int", "long"]


def test_partial_indexes_include_both_bson_integer_types() -> None:
    checked_fields: set[str] = set()

    for collection in COLLECTIONS:
        for index in collection.indexes:
            partial = index.document.get("partialFilterExpression", {})
            for field_name, condition in partial.items():
                if (
                    field_name.endswith("_id")
                    and "$type" in condition
                    and condition["$type"] != "string"
                ):
                    checked_fields.add(f"{collection.name}.{field_name}")
                    assert condition["$type"] == ["int", "long"]

    assert checked_fields == {
        "activity_logs.project_id",
        "comments.project_id",
        "comments.task_id",
        "expenses.funding_id",
        "groups.organization_id",
        "groups.project_id",
        "notifications.activity_id",
        "tasks.parent_id",
        "tasks.project_funding_id",
        "tasks.template_id",
        "time_entries.funding_id",
    }


def test_all_attachments_are_limited_to_prd_size_range() -> None:
    attachment_schemas = [
        TASKS.schema["properties"]["attachments"]["items"],
        COMMENTS.schema["properties"]["attachments"]["items"],
        EXPENSES.schema["properties"]["attachments"]["items"],
    ]

    for schema in attachment_schemas:
        size = schema["properties"]["size_bytes"]
        assert size == {
            "bsonType": ["int", "long"],
            "minimum": 0,
            "exclusiveMinimum": True,
            "maximum": 50 * 1024 * 1024,
        }


def test_unique_task_index_starts_with_organization_shard_key() -> None:
    unique_index = next(index.document for index in TASKS.indexes if index.document.get("unique"))

    assert list(unique_index["key"]) == [
        "organization_id",
        "project_funding_id",
        "template_id",
    ]


def test_unique_notification_indexes_start_with_recipient_shard_key() -> None:
    unique_indexes = [
        index.document for index in NOTIFICATIONS.indexes if index.document.get("unique")
    ]

    assert all(next(iter(index["key"])) == "recipient_user_id" for index in unique_indexes)


def test_time_entry_requires_start_and_allows_an_open_interval() -> None:
    properties = TIME_ENTRIES.schema["properties"]

    assert properties["started_at"] == {"bsonType": "date"}
    assert "started_at" in TIME_ENTRIES.schema["required"]
    assert properties["finished_at"] == {"bsonType": ["date", "null"]}
    assert "finished_at" not in TIME_ENTRIES.schema["required"]
    assert "maximum" not in properties["hours"]
    assert TIME_ENTRIES.rules == [
        {
            "$or": [
                {"$eq": [{"$ifNull": ["$finished_at", None]}, None]},
                {"$gt": ["$finished_at", "$started_at"]},
            ]
        }
    ]


def test_notifications_are_not_deleted_by_ttl() -> None:
    assert all("expireAfterSeconds" not in index.document for index in NOTIFICATIONS.indexes)


def test_group_without_organization_matches_relational_null_semantics() -> None:
    organization_id = GROUPS.schema["properties"]["organization_id"]
    name_index = next(index.document for index in GROUPS.indexes if index.document.get("unique"))

    assert organization_id["bsonType"] == ["int", "long", "null"]
    assert "organization_id" not in GROUPS.schema["required"]
    assert name_index["partialFilterExpression"] == {"organization_id": {"$type": ["int", "long"]}}
