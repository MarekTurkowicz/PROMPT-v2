from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    INT,
    LONG,
    OPT_LONG,
    OPT_STRING,
    ROLE_GRANT,
    STRING,
    CollectionSpec,
    array_of,
    document,
    nullable_enum,
)

BUILTIN_GROUP_CODES = ["administrators", "financial_controllers"]  # open decision, PRD 3.3

GROUPS = CollectionSpec(
    name="groups",
    schema=document(
        {
            "organization_id": LONG,
            "project_id": OPT_LONG,
            "code": nullable_enum(BUILTIN_GROUP_CODES),
            "parent_id": OPT_LONG,
            "ancestor_ids": array_of(LONG),
            "name": STRING,
            "description": OPT_STRING,
            "role_grants": array_of(ROLE_GRANT, max_items=100),
            "created_at": DATE,
            "version": INT,
        }
    ),
    indexes=[
        IndexModel([("organization_id", 1), ("name", 1)], unique=True),
        IndexModel([("organization_id", 1), ("ancestor_ids", 1)]),
        IndexModel(
            [("organization_id", 1), ("project_id", 1)],
            partialFilterExpression={"project_id": {"$type": "long"}},
        ),
        IndexModel(
            [("organization_id", 1), ("code", 1)],
            unique=True,
            partialFilterExpression={"code": {"$type": "string"}},
        ),
    ],
)
