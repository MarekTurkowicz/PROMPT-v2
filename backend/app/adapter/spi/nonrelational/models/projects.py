from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    BOOL,
    DATE,
    INT,
    LONG,
    OPT_DATE,
    POSITION,
    STATUS,
    STRING,
    CollectionSpec,
    array_of,
    at_most_one,
    distinct,
    document,
    enum,
    every,
    is_unset,
    not_before,
    numeric,
    obj,
    varchar,
)

PROJECT_STATUSES = ["planned", "active", "closed", "cancelled", "archived"]
MILESTONE_STATUSES = ["planned", "active", "done"]
HEALTH_STATES = ["ok", "attention", "at_risk"]

MILESTONE = obj(
    {
        "_id": LONG,
        "name": varchar(200),
        "status": enum(MILESTONE_STATUSES),
        "due_date": OPT_DATE,
        "position": POSITION,
        "created_at": DATE,
        "updated_at": DATE,
    }
)

PROJECT_FUNDING = obj(
    {
        "_id": LONG,
        "funding_id": LONG,
        "allocation_start": OPT_DATE,
        "allocation_end": OPT_DATE,
        "allocated_amount": numeric(14, 2, null=True),
        "is_primary": BOOL,
        "note": STRING,
        "created_at": DATE,
        "detached_at": OPT_DATE,
    }
)

# last evaluated health, used only to raise alerts
HEALTH = obj(
    {"state": enum(HEALTH_STATES), "reasons": array_of(STRING), "evaluated_at": DATE},
    null=True,
)

ATTACHED_FUNDINGS = {
    "$filter": {
        "input": {"$ifNull": ["$fundings", []]},
        "as": "f",
        "cond": is_unset("$$f.detached_at"),
    }
}

PROJECTS = CollectionSpec(
    name="projects",
    schema=document(
        {
            "organization_id": LONG,
            "owner_id": LONG,
            "name": varchar(200),
            "description": STRING,
            "status": enum(PROJECT_STATUSES),
            "start_date": OPT_DATE,
            "end_date": OPT_DATE,
            "hidden_status_ids": array_of(LONG, uniqueItems=True),
            "statuses": array_of(STATUS, max_items=30),
            "milestones": array_of(MILESTONE, max_items=100),
            "fundings": array_of(PROJECT_FUNDING, max_items=500),
            "health": HEALTH,
            "created_at": DATE,
            "updated_at": DATE,
            "version": INT,
        }
    ),
    rules=[
        not_before("$end_date", "$start_date"),
        distinct("$statuses._id"),
        distinct("$statuses.name"),
        distinct("$milestones._id"),
        distinct("$fundings._id"),
        distinct({"$map": {"input": ATTACHED_FUNDINGS, "as": "f", "in": "$$f.funding_id"}}),
        at_most_one("$fundings", "f", {"$and": ["$$f.is_primary", is_unset("$$f.detached_at")]}),
        every("$fundings", "f", not_before("$$f.allocation_end", "$$f.allocation_start")),
    ],
    indexes=[
        IndexModel([("organization_id", 1), ("status", 1), ("name", 1)]),
        IndexModel([("organization_id", 1), ("fundings.funding_id", 1)]),
        IndexModel([("organization_id", 1), ("owner_id", 1)]),
    ],
)
