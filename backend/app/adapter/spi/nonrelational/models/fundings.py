from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    INT,
    LONG,
    MONEY,
    OPT_DATE,
    OPT_LONG,
    PRIORITY,
    STRING,
    CollectionSpec,
    array_of,
    document,
    enum,
    not_before,
    nullable,
    obj,
)

FUNDING_TYPES = ["grant", "sponsorship", "donation", "internal"]

TASK_TEMPLATE = obj(
    {
        "_id": LONG,
        "title": STRING,
        "description": STRING,
        "default_status_id": OPT_LONG,
        "default_priority": PRIORITY,
        "default_est_hours": nullable("decimal", minimum=0, exclusiveMinimum=True),
        "default_due_days": nullable("int", minimum=0),
    }
)

FUNDINGS = CollectionSpec(
    name="fundings",
    schema=document(
        {
            "organization_id": OPT_LONG,
            "type": enum(FUNDING_TYPES),
            "name": STRING,
            "funder": STRING,
            "program": STRING,
            "agreement_number": STRING,
            "amount": MONEY,
            "start_date": OPT_DATE,
            "end_date": OPT_DATE,
            "reporting_deadline": OPT_DATE,
            "description": STRING,
            "templates": array_of(TASK_TEMPLATE, max_items=100),
            "created_at": DATE,
            "updated_at": DATE,
            "version": INT,
        }
    ),
    rules=[not_before("$end_date", "$start_date")],
    indexes=[
        IndexModel([("organization_id", 1), ("name", 1)]),
        IndexModel(
            [("organization_id", 1), ("reporting_deadline", 1)],
            partialFilterExpression={"reporting_deadline": {"$type": "date"}},
        ),
    ],
)
