import os
import uuid
from collections.abc import Iterator
from datetime import UTC, datetime
from typing import Any

import pytest
from bson import Decimal128
from pymongo import IndexModel, MongoClient
from pymongo.database import Database
from pymongo.errors import WriteError

from app.adapter.spi.nonrelational.init_mongo import init_mongo
from app.adapter.spi.nonrelational.models import COLLECTIONS
from app.adapter.spi.nonrelational.models._schema import MONEY, STATUS, CollectionSpec
from app.adapter.spi.nonrelational.models.groups import GROUPS
from app.adapter.spi.nonrelational.models.members import MEMBERS
from app.adapter.spi.nonrelational.models.organizations import ORGANIZATIONS
from app.adapter.spi.nonrelational.models.projects import PROJECTS
from app.adapter.spi.nonrelational.models.tasks import TASKS
from app.adapter.spi.nonrelational.models.time_entries import TIME_ENTRIES


@pytest.fixture
def db() -> Iterator[Database[dict[str, Any]]]:
    client: MongoClient[dict[str, Any]] = MongoClient(
        os.environ.get("MONGO_URL", "mongodb://localhost:27017"), serverSelectionTimeoutMS=3000
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
            assert info[options["name"]].get("partialFilterExpression") == options.get(
                "partialFilterExpression"
            ), options["name"]


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


def grant(role_id: int, project_id: int | None) -> dict[str, Any]:
    return {"role_id": role_id, "project_id": project_id}


def funding(funding_id: int, *, primary: bool = False, detached: bool = False) -> dict[str, Any]:
    detached_at = datetime(2026, 1, 1, tzinfo=UTC) if detached else None
    return {"funding_id": funding_id, "is_primary": primary, "detached_at": detached_at}


@pytest.mark.parametrize(
    ("spec", "document", "valid"),
    [
        (MEMBERS, {"groups": [{"group_id": 1}, {"group_id": 2}]}, True),
        (MEMBERS, {"groups": [{"group_id": 1}, {"group_id": 1}]}, False),
        (MEMBERS, {"role_grants": [grant(1, None), grant(1, 5)]}, True),
        (MEMBERS, {"role_grants": [grant(1, None), grant(1, None)]}, False),
        (GROUPS, {"role_grants": [grant(1, 5), grant(1, 5)]}, False),
        (TASKS, {"assignments": [{"member_id": 1}, {"member_id": 2}]}, True),
        (TASKS, {"assignments": [{"member_id": 1}, {"member_id": 1}]}, False),
        (PROJECTS, {"fundings": [funding(1, detached=True), funding(1)]}, True),
        (PROJECTS, {"fundings": [funding(1), funding(1)]}, False),
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
