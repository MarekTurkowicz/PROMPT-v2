from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    INT,
    LONG,
    OPT_LONG,
    OPT_STRING,
    PRESENT_ID,
    PRESENT_STRING,
    ROLE_GRANT,
    CollectionSpec,
    array_of,
    distinct,
    distinct_role_grants,
    document,
    nullable_enum,
    varchar,
)

BUILTIN_GROUP_CODES = ["administrators", "financial_controllers"]

GROUPS = CollectionSpec(
    name="groups",
    schema=document(
        {
            "organization_id": LONG,
            "project_id": OPT_LONG,
            "code": nullable_enum(BUILTIN_GROUP_CODES),
            "parent_id": OPT_LONG,
            "ancestor_ids": array_of(LONG),
            "name": varchar(120),
            "description": OPT_STRING,
            "role_grants": array_of(ROLE_GRANT, max_items=100),
            "created_at": DATE,
            "version": INT,
        }
    ),
    rules=[distinct("$role_grants._id"), distinct_role_grants("$role_grants")],
    indexes=[
        IndexModel([("organization_id", 1), ("name", 1)], unique=True),
        IndexModel([("organization_id", 1), ("ancestor_ids", 1)]),
        IndexModel(
            [("organization_id", 1), ("project_id", 1)],
            partialFilterExpression={"project_id": PRESENT_ID},
        ),
        IndexModel(
            [("organization_id", 1), ("code", 1)],
            unique=True,
            partialFilterExpression={"code": PRESENT_STRING},
        ),
    ],
)
