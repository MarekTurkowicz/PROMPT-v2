import os
import uuid
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from bson import Decimal128
from django.core.management import call_command
from pymongo import IndexModel, MongoClient
from pymongo.database import Database
from pymongo.errors import WriteError

from app.adapter.spi.nonrelational.init_mongo import init_mongo
from app.adapter.spi.nonrelational.models import COLLECTIONS
from app.adapter.spi.nonrelational.models._schema import MONEY, STATUS, CollectionSpec
from app.adapter.spi.nonrelational.models.comments import COMMENTS
from app.adapter.spi.nonrelational.models.expenses import EXPENSES
from app.adapter.spi.nonrelational.models.fundings import FUNDINGS
from app.adapter.spi.nonrelational.models.groups import GROUPS
from app.adapter.spi.nonrelational.models.members import MEMBERS
from app.adapter.spi.nonrelational.models.organizations import ORGANIZATIONS
from app.adapter.spi.nonrelational.models.projects import PROJECTS
from app.adapter.spi.nonrelational.models.tasks import TASKS
from app.adapter.spi.nonrelational.models.time_entries import TIME_ENTRIES


@pytest.fixture
def db() -> Iterator[Database[dict[str, Any]]]:
    client: MongoClient[dict[str, Any]] = MongoClient(
        os.environ.get(
            "MONGO_URL", "mongodb://localhost:27017/?replicaSet=rs0&directConnection=true"
        ),
        serverSelectionTimeoutMS=3000,
    )
    name = f"promt_test_{uuid.uuid4().hex[:8]}"
    try:
        yield client[name]
    finally:
        client.drop_database(name)
        client.close()


def status(_id: int, name: str, *, is_default: bool = False) -> dict[str, Any]:
    return {
        "_id": _id,
        "category": "todo",
        "name": name,
        "color": "#94a3b8",
        "position": 0,
        "is_default": is_default,
        "is_active": True,
    }


def role(_id: int, name: str, code: str | None) -> dict[str, Any]:
    return {"_id": _id, "code": code, "name": name, "permissions": []}


def organization(statuses: list[dict[str, Any]], roles: list[dict[str, Any]]) -> dict[str, Any]:
    now = datetime.now(UTC)
    return {
        "_id": 1,
        "name": "Org",
        "tax_id": None,
        "is_active": True,
        "settings": {
            "timezone": "Europe/Warsaw",
            "currency": "PLN",
            "priority_names": ["1", "2", "3", "4", "5"],
            "working_days": [1, 2, 3, 4, 5],
            "health_thresholds": None,
            "history_retention_days": None,
        },
        "statuses": statuses,
        "roles": roles,
        "created_at": now,
        "updated_at": now,
        "version": 1,
    }


def test_rerun_rebuilds_changed_indexes_and_drops_obsolete_ones(
    db: Database[dict[str, Any]],
) -> None:
    db.create_collection("groups")
    db.groups.create_indexes(
        [
            IndexModel(
                [("organization_id", 1), ("name", 1)],
                unique=True,
                partialFilterExpression={"organization_id": {"$type": ["int", "long"]}},
            ),
            IndexModel([("legacy", 1)]),
        ]
    )

    init_mongo(db)
    init_mongo(db)

    for spec in COLLECTIONS:
        info = db[spec.name].index_information()
        assert set(info) == {"_id_"} | {index.document["name"] for index in spec.indexes}
        for index in spec.indexes:
            options = index.document
            for option in ("partialFilterExpression", "unique", "expireAfterSeconds"):
                assert info[options["name"]].get(option) == options.get(option), options["name"]


def test_manage_py_init_mongo_runs_twice(
    db: Database[dict[str, Any]], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("MONGO_DB", db.name)

    call_command("init_mongo")
    call_command("init_mongo")

    assert set(db.list_collection_names()) == {spec.name for spec in COLLECTIONS}
    assert db.notifications.index_information()["created_at_1"]["expireAfterSeconds"] == (
        180 * 24 * 60 * 60
    )


def test_organization_accepts_unique_statuses_and_custom_roles_without_code(
    db: Database[dict[str, Any]],
) -> None:
    init_mongo(db)

    db.organizations.insert_one(
        organization(
            [status(1, "To do", is_default=True), status(2, "Done")],
            [role(1, "Admin", "organization_admin"), role(2, "Custom A", None), role(3, "B", None)],
        )
    )


@pytest.mark.parametrize(
    ("statuses", "roles"),
    [
        ([status(1, "To do", is_default=True), status(2, "Next", is_default=True)], []),
        ([status(1, "Done"), status(2, "Done")], []),
        ([status(1, "To do"), status(1, "Done")], []),
        ([], [role(1, "Admin", "organization_admin"), role(2, "Admin 2", "organization_admin")]),
        ([], [role(1, "Same", None), role(2, "Same", None)]),
    ],
    ids=["two-defaults", "same-status-name", "same-status-id", "same-role-code", "same-role-name"],
)
def test_organization_rejects_duplicates_inside_embedded_arrays(
    db: Database[dict[str, Any]],
    statuses: list[dict[str, Any]],
    roles: list[dict[str, Any]],
) -> None:
    init_mongo(db)

    with pytest.raises(WriteError):
        db.organizations.insert_one(organization(statuses, roles))


def grant(role_id: int, project_id: int | None, *, grant_id: int | None = None) -> dict[str, Any]:
    return {
        "_id": role_id if grant_id is None else grant_id,
        "role_id": role_id,
        "project_id": project_id,
    }


def funding(
    funding_id: int, *, primary: bool = False, detached: bool = False, link_id: int | None = None
) -> dict[str, Any]:
    detached_at = datetime(2026, 1, 1, tzinfo=UTC) if detached else None
    return {
        "_id": funding_id if link_id is None else link_id,
        "funding_id": funding_id,
        "is_primary": primary,
        "detached_at": detached_at,
    }


@pytest.mark.parametrize(
    ("spec", "document", "valid"),
    [
        (MEMBERS, {"groups": [{"group_id": 1}, {"group_id": 2}]}, True),
        (MEMBERS, {"groups": [{"group_id": 1}, {"group_id": 1}]}, False),
        (MEMBERS, {"role_grants": [grant(1, None), grant(1, 5, grant_id=2)]}, True),
        (MEMBERS, {"role_grants": [grant(1, None), grant(1, None, grant_id=2)]}, False),
        (GROUPS, {"role_grants": [grant(1, 5), grant(1, 5, grant_id=2)]}, False),
        (TASKS, {"assignments": [{"_id": 1, "member_id": 1}, {"_id": 2, "member_id": 2}]}, True),
        (TASKS, {"assignments": [{"_id": 1, "member_id": 1}, {"_id": 2, "member_id": 1}]}, False),
        (PROJECTS, {"fundings": [funding(1, detached=True, link_id=2), funding(1)]}, True),
        (PROJECTS, {"fundings": [funding(1), funding(1, link_id=2)]}, False),
        (
            PROJECTS,
            {"fundings": [funding(1, primary=True, detached=True), funding(2, primary=True)]},
            True,
        ),
        (PROJECTS, {"fundings": [funding(1, primary=True), funding(2, primary=True)]}, False),
    ],
)
def test_embedded_uniqueness_rules_match_relational_constraints(
    db: Database[dict[str, Any]], spec: CollectionSpec, document: dict[str, Any], valid: bool
) -> None:
    pipeline: list[dict[str, Any]] = [
        {"$documents": [document]},
        {"$match": {"$expr": {"$and": spec.rules}}},
    ]

    assert bool(list(db.aggregate(pipeline))) is valid


@pytest.mark.parametrize(
    ("spec", "field", "first", "second"),
    [
        (ORGANIZATIONS, "statuses", status(1, "Todo"), status(2, "Done")),
        (ORGANIZATIONS, "roles", role(1, "A", None), role(2, "B", None)),
        (MEMBERS, "role_grants", grant(1, None), grant(2, None)),
        (GROUPS, "role_grants", grant(1, None), grant(2, None)),
        (PROJECTS, "statuses", status(1, "Todo"), status(2, "Done")),
        (PROJECTS, "milestones", {"_id": 1}, {"_id": 2}),
        (PROJECTS, "fundings", funding(1, detached=True), funding(2)),
        (FUNDINGS, "templates", {"_id": 1}, {"_id": 2}),
        (TASKS, "assignments", {"_id": 1, "member_id": 1}, {"_id": 2, "member_id": 2}),
        (TASKS, "checklist", {"_id": 1}, {"_id": 2}),
        (TASKS, "attachments", {"_id": 1}, {"_id": 2}),
        (COMMENTS, "attachments", {"_id": 1}, {"_id": 2}),
        (EXPENSES, "attachments", {"_id": 1}, {"_id": 2}),
    ],
    ids=[
        "organization-statuses",
        "organization-roles",
        "member-grants",
        "group-grants",
        "project-statuses",
        "milestones",
        "funding-links",
        "templates",
        "assignments",
        "checklist",
        "task-attachments",
        "comment-attachments",
        "expense-attachments",
    ],
)
def test_embedded_ids_are_unique_even_when_other_fields_differ(
    db: Database[dict[str, Any]],
    spec: CollectionSpec,
    field: str,
    first: dict[str, Any],
    second: dict[str, Any],
) -> None:
    for candidate, expected in [(second, True), ({**second, "_id": first["_id"]}, False)]:
        pipeline: list[dict[str, Any]] = [
            {"$documents": [{field: [first, candidate]}]},
            {"$match": {"$expr": {"$and": spec.rules}}},
        ]
        assert bool(list(db.aggregate(pipeline))) is expected


@pytest.mark.parametrize(("count", "valid"), [(100, True), (500, True), (501, False)])
def test_project_funding_limit_includes_detached_history(
    db: Database[dict[str, Any]], count: int, valid: bool
) -> None:
    now = datetime(2026, 1, 1, tzinfo=UTC)
    links = [
        {
            **funding(1, detached=True, link_id=i),
            "note": "",
            "created_at": now,
        }
        for i in range(count)
    ]
    pipeline: list[dict[str, Any]] = [
        {"$documents": [{"fundings": links}]},
        {
            "$match": {
                "$jsonSchema": {
                    "properties": {
                        "fundings": PROJECTS.schema["properties"]["fundings"],
                    }
                }
            }
        },
    ]
    assert bool(list(db.aggregate(pipeline))) is valid


@pytest.mark.parametrize("kind", ["event", "due_soon"])
@pytest.mark.parametrize("content_state", ["missing", "null", "snapshot"])
def test_notifications_require_content_independent_of_activity_retention(
    db: Database[dict[str, Any]], kind: str, content_state: str
) -> None:
    init_mongo(db)
    notification: dict[str, Any] = {
        "_id": 1,
        "recipient_user_id": 1,
        "kind": kind,
        "created_at": datetime(2026, 1, 1, tzinfo=UTC),
    }
    if kind == "event":
        notification["activity_id"] = 42
    if content_state != "missing":
        notification["content"] = (
            {"title": "Task changed", "body": "Status: done", "link": None}
            if content_state == "snapshot"
            else None
        )
    if content_state == "snapshot":
        db.notifications.insert_one(notification)
        saved = db.notifications.find_one({"_id": 1})
        assert saved is not None
        assert saved["content"] == notification["content"]
    else:
        with pytest.raises(WriteError) as error:
            db.notifications.insert_one(notification)
        assert error.value.code == 121


def test_multi_collection_transaction_rolls_back_on_invalid_notification(
    db: Database[dict[str, Any]],
) -> None:
    init_mongo(db)
    with (
        db.client.start_session() as session,
        pytest.raises(WriteError),
        session.start_transaction(),
    ):
        db.organizations.insert_one(organization([], []), session=session)
        db.notifications.insert_one({"_id": 1}, session=session)
    assert db.organizations.count_documents({}) == 0
    assert db.notifications.count_documents({}) == 0


def time_entry(**fields: Any) -> dict[str, Any]:
    now = datetime(2026, 11, 10, tzinfo=UTC)
    return {
        "_id": 1,
        "organization_id": 1,
        "assignment_id": 1,
        "task_id": 1,
        "member_id": 1,
        "project_id": 1,
        "funding_id": None,
        "work_date": now,
        "hours": Decimal128("3.00"),
        "note": None,
        "created_at": now,
        "updated_at": now,
        **fields,
    }


START = datetime(2026, 11, 10, 8, tzinfo=UTC)


@pytest.mark.parametrize(
    ("fields", "valid"),
    [
        ({}, True),
        ({"started_at": START}, True),
        ({"started_at": START, "finished_at": START + timedelta(hours=3)}, True),
        ({"finished_at": START}, False),
        ({"started_at": START, "finished_at": START}, False),
        ({"work_date": None}, False),
    ],
    ids=["hours-only", "running", "interval", "end-without-start", "empty-interval", "no-date"],
)
def test_time_entry_needs_work_date_and_an_optional_interval(
    db: Database[dict[str, Any]], fields: dict[str, Any], valid: bool
) -> None:
    init_mongo(db)
    entry = time_entry(**fields)

    if valid:
        db.time_entries.insert_one(entry)
    else:
        with pytest.raises(WriteError) as error:
            db.time_entries.insert_one(entry)
        assert error.value.code == 121


@pytest.mark.parametrize("organization_id", [None, "missing"])
def test_group_requires_organization(
    db: Database[dict[str, Any]], organization_id: str | None
) -> None:
    init_mongo(db)
    group: dict[str, Any] = {
        "_id": 1,
        "organization_id": organization_id,
        "project_id": None,
        "code": None,
        "parent_id": None,
        "ancestor_ids": [],
        "name": "Team",
        "description": None,
        "role_grants": [],
        "created_at": datetime(2026, 1, 1, tzinfo=UTC),
        "version": 1,
    }
    if organization_id == "missing":
        del group["organization_id"]

    with pytest.raises(WriteError) as error:
        db.groups.insert_one(group)
    assert error.value.code == 121
    db.groups.insert_one({**group, "organization_id": 1})


def test_equality_queries_use_partial_indexes(db: Database[dict[str, Any]]) -> None:
    init_mongo(db)

    plan = db.tasks.find({"organization_id": 1, "parent_id": 7}).explain()["queryPlanner"]

    assert "parent_id_1" in str(plan["winningPlan"])


ORGANIZATION_NAME = ORGANIZATIONS.schema["properties"]["name"]
HOURS = TIME_ENTRIES.schema["properties"]["hours"]
AMOUNT = MONEY["properties"]["value"]
STATUS_POSITION = STATUS["properties"]["position"]


@pytest.mark.parametrize(
    ("schema", "value", "valid"),
    [
        (ORGANIZATION_NAME, "ż" * 200, True),
        (ORGANIZATION_NAME, "ż" * 201, False),
        (HOURS, Decimal128("999.99"), True),
        (HOURS, Decimal128("1000.00"), False),
        (HOURS, Decimal128("1.005"), False),
        (HOURS, Decimal128("0"), False),
        (AMOUNT, Decimal128("999999999999.99"), True),
        (AMOUNT, Decimal128("1000000000000.00"), False),
        (STATUS_POSITION, 32767, True),
        (STATUS_POSITION, -1, False),
    ],
)
def test_values_fit_relational_column_limits(
    db: Database[dict[str, Any]], schema: dict[str, Any], value: object, valid: bool
) -> None:
    pipeline: list[dict[str, Any]] = [
        {"$documents": [{"v": value}]},
        {"$match": {"$jsonSchema": {"properties": {"v": schema}}}},
    ]

    assert bool(list(db.aggregate(pipeline))) is valid
