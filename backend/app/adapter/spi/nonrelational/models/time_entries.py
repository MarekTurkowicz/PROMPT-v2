from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    LONG,
    OPT_DATE,
    OPT_LONG,
    OPT_STRING,
    CollectionSpec,
    both_or_neither,
    bson,
    document,
    is_unset,
)

TIME_ENTRIES = CollectionSpec(
    name="time_entries",
    schema=document(
        {
            "organization_id": LONG,
            "assignment_id": LONG,
            "task_id": LONG,
            "member_id": LONG,
            "project_id": OPT_LONG,
            "funding_id": OPT_LONG,
            "work_date": DATE,
            "hours": bson("decimal", minimum=0, exclusiveMinimum=True, maximum=24),
            "started_at": OPT_DATE,
            "finished_at": OPT_DATE,
            "note": OPT_STRING,
            "created_at": DATE,
            "updated_at": DATE,
        }
    ),
    rules=[
        both_or_neither("$started_at", "$finished_at"),
        {"$or": [is_unset("$started_at"), {"$gt": ["$finished_at", "$started_at"]}]},
    ],
    indexes=[
        IndexModel([("organization_id", 1), ("member_id", 1), ("work_date", -1)]),
        IndexModel([("organization_id", 1), ("task_id", 1), ("work_date", 1)]),
        IndexModel([("assignment_id", 1)]),
        IndexModel([("organization_id", 1), ("project_id", 1), ("work_date", 1)]),
        IndexModel(
            [("organization_id", 1), ("funding_id", 1)],
            partialFilterExpression={"funding_id": {"$type": ["int", "long"]}},
        ),
    ],
)
