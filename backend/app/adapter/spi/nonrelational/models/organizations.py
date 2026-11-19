from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    BOOL,
    DATE,
    INT,
    LONG,
    OPT_STRING,
    PRESENT_STRING,
    STATUS,
    STRING,
    CollectionSpec,
    array_of,
    at_most_one,
    bson,
    distinct,
    document,
    nullable_enum,
    obj,
)

BUILTIN_ROLE_CODES = [
    "viewer",
    "member",
    "project_manager",
    "project_director",
    "organization_director",
    "organization_admin",
    "financial_controller",
]

ROLE = obj(
    {
        "_id": LONG,
        "code": nullable_enum(BUILTIN_ROLE_CODES),
        "name": STRING,
        "permissions": array_of(STRING),
    }
)

ORGANIZATIONS = CollectionSpec(
    name="organizations",
    schema=document(
        {
            "name": STRING,
            "tax_id": OPT_STRING,
            "is_active": BOOL,
            # Keys and their rules belong to the domain (OrganizationSettings), as in jsonb.
            "settings": bson("object"),
            "statuses": array_of(STATUS),
            "roles": array_of(ROLE),
            "created_at": DATE,
            "modified_at": DATE,
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
