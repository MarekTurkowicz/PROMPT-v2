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
    distinct,
    document,
    enum,
    not_before,
    nullable,
    numeric,
    obj,
    varchar,
)

FUNDING_TYPES = ["grant", "sponsorship", "donation", "internal"]

TASK_TEMPLATE = obj(
    {
        "_id": LONG,
        "title": varchar(200),
        "description": STRING,
        "default_status_id": OPT_LONG,
        "default_priority": PRIORITY,
        "default_est_hours": numeric(6, 2, null=True),
        "default_due_days": nullable("int", minimum=0),
    }
)

FUNDINGS = CollectionSpec(
    name="fundings",
    schema=document(
        {
            "organization_id": OPT_LONG,
            "type": enum(FUNDING_TYPES),
            "name": varchar(200),
            "funder": varchar(200),
            "program": varchar(200),
            "agreement_number": varchar(100),
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
    rules=[not_before("$end_date", "$start_date"), distinct("$templates._id")],
    indexes=[
        IndexModel([("organization_id", 1), ("name", 1)]),
        IndexModel([("organization_id", 1), ("reporting_deadline", 1)]),
    ],
)
