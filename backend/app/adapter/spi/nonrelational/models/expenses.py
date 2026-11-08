from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    LONG,
    MONEY,
    OPT_LONG,
    OPT_STRING,
    STRING,
    CollectionSpec,
    array_of,
    attachment,
    both_or_neither,
    document,
    enum,
)

EXPENSE_TYPES = ["travel", "courses", "external_services", "equipment", "other"]
EXPENSES = CollectionSpec(
    name="expenses",
    schema=document(
        {
            "organization_id": LONG,
            "project_id": LONG,
            "project_funding_id": OPT_LONG,
            "funding_id": OPT_LONG,
            "task_id": OPT_LONG,
            "type": enum(EXPENSE_TYPES),
            "amount": MONEY,
            "spent_on_date": DATE,
            "document_number": OPT_STRING,
            "description": STRING,
            "created_by": LONG,
            "attachments": array_of(attachment(), max_items=20),
            "created_at": DATE,
            "updated_at": DATE,
        }
    ),
    rules=[both_or_neither("$funding_id", "$project_funding_id")],
    indexes=[
        IndexModel([("organization_id", 1), ("project_id", 1), ("spent_on_date", -1)]),
        IndexModel(
            [("organization_id", 1), ("funding_id", 1), ("spent_on_date", 1)],
            partialFilterExpression={"funding_id": {"$type": ["int", "long"]}},
        ),
    ],
)
