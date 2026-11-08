from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    BOOL,
    CURRENCY_PATTERN,
    DATE,
    INT,
    LONG,
    PRESENT_STRING,
    STATUS,
    STRING,
    CollectionSpec,
    array_of,
    at_most_one,
    bson,
    distinct,
    document,
    nullable,
    nullable_enum,
    obj,
    varchar,
)

BUILTIN_ROLE_CODES = [
    "viewer",
    "member",
    "project_manager",
    "project_director",
    "organization_director",
    "organization_admin",
    "financial_controller",  # pending CORE-2 decision (#72)
]

PERCENT = bson("int", minimum=0)

SETTINGS = obj(
    {
        "timezone": STRING,
        "currency": bson("string", pattern=CURRENCY_PATTERN),
        "priority_names": array_of(STRING, minItems=5, maxItems=5),
        "working_days": array_of(bson("int", minimum=1, maximum=7), max_items=7, uniqueItems=True),
        # pending CORE-2 decision (#72)
        "health_thresholds": obj(
            {
                "overdue_risk_pct": PERCENT,
                "budget_warn_pct": PERCENT,
                "budget_risk_pct": PERCENT,
                "hours_warn_pct": PERCENT,
            },
            null=True,
        ),
        "history_retention_days": nullable("int", minimum=1),
    }
)

ROLE = obj(
    {
        "_id": LONG,
        "code": nullable_enum(BUILTIN_ROLE_CODES),
        "name": varchar(120),
        "permissions": array_of(varchar(60), uniqueItems=True),
    }
)

ORGANIZATIONS = CollectionSpec(
    name="organizations",
    schema=document(
        {
            "name": varchar(200),
            "tax_id": varchar(20, null=True),
            "is_active": BOOL,
            "settings": SETTINGS,
            "statuses": array_of(STATUS, max_items=50),
            "roles": array_of(ROLE, max_items=50),
            "created_at": DATE,
            "updated_at": DATE,
            "version": INT,
        }
    ),
    rules=[
        distinct("$statuses._id"),
        distinct("$statuses.name"),
        at_most_one("$statuses", "s", "$$s.is_default"),
        distinct("$roles._id"),
        distinct("$roles.name"),
        distinct("$roles.code", skip_null=True),
    ],
    indexes=[
        IndexModel(
            [("tax_id", 1)],
            unique=True,
            partialFilterExpression={"tax_id": PRESENT_STRING},
        ),
    ],
)
