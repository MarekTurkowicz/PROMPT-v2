from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    BOOL,
    DATE,
    INT,
    LONG,
    OPT_DATE,
    STATUS,
    STRING,
    CollectionSpec,
    array_of,
    document,
    enum,
    every,
    not_before,
    obj,
)

PROJECT_STATUSES = ["planned", "active", "closed", "cancelled", "archived"]
MILESTONE_STATUSES = ["planned", "active", "done"]
HEALTH_STATES = ["ok", "attention", "at_risk"]

MILESTONE = obj(
    {
        "_id": LONG,
        "name": STRING,
        "status": enum(MILESTONE_STATUSES),
        "due_date": OPT_DATE,
        "position": INT,
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
        "is_primary": BOOL,
        "note": STRING,
        "created_at": DATE,
        "detached_at": OPT_DATE,
    }
)

# open decision D5: last evaluated health, used only to raise alerts
HEALTH = obj(
    {"state": enum(HEALTH_STATES), "reasons": array_of(STRING), "evaluated_at": DATE},
    null=True,
)

PROJECTS = CollectionSpec(
    name="projects",
    schema=document(
        {
            "organization_id": LONG,
            "owner_id": LONG,
            "name": STRING,
            "description": STRING,
            "status": enum(PROJECT_STATUSES),
            "start_date": OPT_DATE,
            "end_date": OPT_DATE,
            "hidden_status_ids": array_of(LONG, uniqueItems=True),
            "statuses": array_of(STATUS, max_items=30),
            "milestones": array_of(MILESTONE, max_items=100),
            "fundings": array_of(PROJECT_FUNDING),
            "health": HEALTH,
            "created_at": DATE,
            "updated_at": DATE,
            "version": INT,
        }
    ),
    rules=[
        not_before("$end_date", "$start_date"),
        every("$fundings", "f", not_before("$$f.allocation_end", "$$f.allocation_start")),
    ],
    indexes=[
        IndexModel([("organization_id", 1), ("status", 1), ("name", 1)]),
        IndexModel([("organization_id", 1), ("fundings.funding_id", 1)]),
        IndexModel([("organization_id", 1), ("owner_id", 1)]),
    ],
)
