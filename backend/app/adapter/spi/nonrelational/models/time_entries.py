from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    LONG,
    OPT_DATE,
    OPT_LONG,
    OPT_STRING,
    PRESENT_ID,
    CollectionSpec,
    document,
    is_unset,
    numeric,
)

TIME_ENTRIES = CollectionSpec(
    name="time_entries",
    schema=document(
        {
            "organization_id": LONG,
            "assignment_id": LONG,
            "task_id": LONG,
            "member_id": LONG,
            "project_id": LONG,
            "funding_id": OPT_LONG,
            "hours": numeric(5, 2),
            "started_at": DATE,
            "finished_at": OPT_DATE,
            "note": OPT_STRING,
            "created_at": DATE,
            "updated_at": DATE,
        }
    ),
    rules=[
        {"$or": [is_unset("$finished_at"), {"$gt": ["$finished_at", "$started_at"]}]},
    ],
    indexes=[
        IndexModel([("organization_id", 1), ("member_id", 1), ("started_at", -1)]),
        IndexModel([("organization_id", 1), ("task_id", 1), ("started_at", 1)]),
        IndexModel([("assignment_id", 1), ("started_at", -1)]),
        IndexModel([("organization_id", 1), ("project_id", 1), ("started_at", 1)]),
        IndexModel(
            [("organization_id", 1), ("funding_id", 1)],
            partialFilterExpression={"funding_id": PRESENT_ID},
        ),
    ],
)
