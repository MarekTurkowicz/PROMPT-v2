from bson import Decimal128

from api.models.activity_log import ActivityAction, EntityType
from app.adapter.spi.nonrelational.models import COLLECTIONS
from app.adapter.spi.nonrelational.models._schema import CollectionSpec, distinct
from app.adapter.spi.nonrelational.models.activity_logs import ACTIVITY_LOGS
from app.adapter.spi.nonrelational.models.comments import COMMENTS
from app.adapter.spi.nonrelational.models.counters import COUNTERS
from app.adapter.spi.nonrelational.models.expenses import EXPENSES
from app.adapter.spi.nonrelational.models.fundings import FUNDINGS
from app.adapter.spi.nonrelational.models.groups import GROUPS
from app.adapter.spi.nonrelational.models.members import MEMBERS
from app.adapter.spi.nonrelational.models.notifications import NOTIFICATIONS
from app.adapter.spi.nonrelational.models.organizations import ORGANIZATIONS
from app.adapter.spi.nonrelational.models.projects import PROJECTS
from app.adapter.spi.nonrelational.models.tasks import TASKS
from app.adapter.spi.nonrelational.models.time_entries import TIME_ENTRIES

OPTIONAL_ID = {"bsonType": ["int", "long", "null"]}
REQUIRED_ID = {"bsonType": ["int", "long"]}


def index_keys(collection: CollectionSpec) -> list[list[str]]:
    return [list(index.document["key"]) for index in collection.indexes]


# PRD 2.1 §7.3, one test per row


def test_z1_task_template_has_no_mandatory_flag() -> None:
    template_schema = FUNDINGS.schema["properties"]["templates"]["items"]

    assert "mandatory" not in template_schema["properties"]
    assert "mandatory" not in template_schema["required"]


def test_z2_task_copies_from_template_flag() -> None:
    properties = TASKS.schema["properties"]

    assert properties["from_template"] == {"bsonType": "bool"}
    assert "from_template" in TASKS.schema["required"]
    assert properties["template_id"] == OPTIONAL_ID


def test_z3_role_code_is_optional_and_unique_in_organization() -> None:
    code = ORGANIZATIONS.schema["properties"]["roles"]["items"]["properties"]["code"]
    prd_codes = {
        "viewer",
        "member",
        "project_manager",
        "project_director",
        "organization_director",
        "organization_admin",
    }

    assert "null" in code["bsonType"]
    assert prd_codes <= set(code["enum"])
    assert distinct("$roles.code", skip_null=True) in ORGANIZATIONS.rules


def test_z4_group_requires_organization_and_may_belong_to_project() -> None:
    properties = GROUPS.schema["properties"]
    name_index = next(
        index.document
        for index in GROUPS.indexes
        if index.document["name"] == "organization_id_1_name_1"
    )

    assert properties["organization_id"] == REQUIRED_ID
    assert "organization_id" in GROUPS.schema["required"]
    assert properties["project_id"] == OPTIONAL_ID
    assert name_index["unique"] is True
    assert "partialFilterExpression" not in name_index


def test_z5_project_funding_has_optional_allocated_amount() -> None:
    funding_properties = PROJECTS.schema["properties"]["fundings"]["items"]["properties"]
    allocated = funding_properties["allocated_amount"]

    assert allocated["bsonType"] == ["decimal", "null"]
    assert allocated["maximum"] == Decimal128("999999999999.99")
    assert allocated["multipleOf"] == Decimal128("0.01")


def test_z6_assignment_keeps_removed_at() -> None:
    assignment = TASKS.schema["properties"]["assignments"]["items"]

    assert assignment["properties"]["removed_at"] == {"bsonType": ["date", "null"]}


def test_z7_time_entry_requires_work_date_and_makes_interval_optional() -> None:
    properties = TIME_ENTRIES.schema["properties"]
    required = TIME_ENTRIES.schema["required"]

    assert properties["work_date"] == {"bsonType": "date"}
    assert "work_date" in required
    assert properties["started_at"] == {"bsonType": ["date", "null"]}
    assert properties["finished_at"] == {"bsonType": ["date", "null"]}
    assert "started_at" not in required
    assert all("started_at" not in keys for keys in index_keys(TIME_ENTRIES))
    assert ["organization_id", "member_id", "work_date"] in index_keys(TIME_ENTRIES)


def test_z8_activity_log_has_project_id_without_reference_and_index() -> None:
    assert ACTIVITY_LOGS.schema["properties"]["project_id"] == OPTIONAL_ID
    assert ["organization_id", "project_id", "created_at"] in index_keys(ACTIVITY_LOGS)


def test_z9_notification_has_created_at() -> None:
    assert NOTIFICATIONS.schema["properties"]["created_at"] == {"bsonType": "date"}
    assert "created_at" in NOTIFICATIONS.schema["required"]


def test_z10_member_has_created_at() -> None:
    assert MEMBERS.schema["properties"]["created_at"] == {"bsonType": "date"}
    assert "created_at" in MEMBERS.schema["required"]


def test_z11_task_has_created_by() -> None:
    assert TASKS.schema["properties"]["created_by"] == REQUIRED_ID
    assert "created_by" in TASKS.schema["required"]


def test_z12_organization_settings_have_health_thresholds() -> None:
    settings = ORGANIZATIONS.schema["properties"]["settings"]["properties"]

    assert settings["health_thresholds"]["bsonType"] == ["object", "null"]


def test_z13_every_root_with_embedded_documents_has_a_version() -> None:
    checked: set[str] = set()

    for collection in COLLECTIONS:
        properties = collection.schema["properties"]
        embeds_documents = any(
            prop.get("bsonType") == "array" and "properties" in prop["items"]
            for prop in properties.values()
        )
        if embeds_documents:
            checked.add(collection.name)
            assert properties["version"] == {"bsonType": "int"}, collection.name
            assert "version" in collection.schema["required"], collection.name

    prd_roots = {"organizations", "members", "groups", "projects", "fundings", "tasks"}
    assert prd_roots | {"comments", "expenses"} <= checked


def test_z14_expense_always_has_project_and_optional_funding() -> None:
    properties = EXPENSES.schema["properties"]

    assert properties["project_id"] == REQUIRED_ID
    assert "project_id" in EXPENSES.schema["required"]
    assert properties["project_funding_id"] == OPTIONAL_ID


# PRD 2.1 §6.5 and §10


def test_notifications_expire_after_180_days() -> None:
    ttl = [
        index.document for index in NOTIFICATIONS.indexes if "expireAfterSeconds" in index.document
    ]

    assert ttl == [
        {"key": {"created_at": 1}, "name": "created_at_1", "expireAfterSeconds": 15552000}
    ]


# Remaining PRD and relational model rules


def test_project_funding_preserves_detached_records() -> None:
    fundings_schema = PROJECTS.schema["properties"]["fundings"]
    milestone_properties = PROJECTS.schema["properties"]["milestones"]["items"]["properties"]

    assert fundings_schema["items"]["properties"]["detached_at"] == {"bsonType": ["date", "null"]}
    assert "start_date" not in milestone_properties
    assert fundings_schema["maxItems"] == 500


def test_funding_can_be_shared_without_an_organization() -> None:
    assert FUNDINGS.schema["properties"]["organization_id"] == OPTIONAL_ID
    assert "organization_id" not in FUNDINGS.schema["required"]


def test_task_always_belongs_to_project_without_direct_funding_reference() -> None:
    task_properties = TASKS.schema["properties"]

    assert task_properties["project_id"] == REQUIRED_ID
    assert "project_id" in TASKS.schema["required"]
    assert "funding_id" not in task_properties
    assert "oneOf" not in TASKS.schema


def test_checklist_item_does_not_add_an_assignee_absent_from_prd() -> None:
    checklist_properties = TASKS.schema["properties"]["checklist"]["items"]["properties"]

    assert "assignee_id" not in checklist_properties


def test_activity_log_dictionaries_match_relational_model() -> None:
    properties = ACTIVITY_LOGS.schema["properties"]

    assert properties["entity_type"]["enum"] == list(EntityType.values)
    assert properties["action"]["enum"] == list(ActivityAction.values)


def test_identifiers_accept_bson_int32_and_int64() -> None:
    assert TASKS.schema["properties"]["_id"] == REQUIRED_ID
    assert TASKS.schema["properties"]["parent_id"] == OPTIONAL_ID
    assert COUNTERS.schema["properties"]["seq"] == REQUIRED_ID


def test_no_partial_index_filters_by_bson_type() -> None:
    filters = [
        index.document["partialFilterExpression"]
        for collection in COLLECTIONS
        for index in collection.indexes
        if "partialFilterExpression" in index.document
    ]

    assert filters
    assert all("$type" not in str(partial) for partial in filters)


def test_indexes_on_optional_fields_skip_missing_values_with_range_filters() -> None:
    partial = {
        f"{collection.name}:{','.join(index.document['key'])}": index.document[
            "partialFilterExpression"
        ]
        for collection in COLLECTIONS
        for index in collection.indexes
        if "partialFilterExpression" in index.document
    }

    assert partial == {
        "organizations:tax_id": {"tax_id": {"$gte": ""}},
        "groups:organization_id,project_id": {"project_id": {"$gte": 0}},
        "groups:organization_id,code": {"code": {"$gte": ""}},
        "tasks:organization_id,due_date": {"status_category": {"$in": ["todo", "in_progress"]}},
        "tasks:organization_id,project_funding_id": {"project_funding_id": {"$gte": 0}},
        "tasks:organization_id,parent_id": {"parent_id": {"$gte": 0}},
        "tasks:organization_id,group_id": {"group_id": {"$gte": 0}},
        "tasks:organization_id,project_funding_id,template_id": {
            "project_funding_id": {"$gte": 0},
            "template_id": {"$gte": 0},
        },
        "time_entries:organization_id,funding_id": {"funding_id": {"$gte": 0}},
        "comments:organization_id,task_id,created_at": {"task_id": {"$gte": 0}},
        "comments:organization_id,project_id,created_at": {"project_id": {"$gte": 0}},
        "expenses:organization_id,funding_id,spent_on_date": {"funding_id": {"$gte": 0}},
        "activity_logs:organization_id,project_id,created_at": {"project_id": {"$gte": 0}},
        "notifications:recipient_user_id,activity_id": {"activity_id": {"$gte": 0}},
        "notifications:recipient_user_id,dedup_key": {"dedup_key": {"$gte": ""}},
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


def test_time_entry_hours_fit_relational_column() -> None:
    assert TIME_ENTRIES.schema["properties"]["hours"]["maximum"] == Decimal128("999.99")
