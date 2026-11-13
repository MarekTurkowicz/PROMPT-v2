from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    INT,
    LONG,
    OPT_DATE,
    ROLE_GRANT,
    STRING,
    CollectionSpec,
    array_of,
    distinct,
    distinct_role_grants,
    document,
    enum,
    implies,
    is_set,
    obj,
    varchar,
)

MEMBER_STATUSES = ["invited", "active", "suspended", "left"]

GROUP_MEMBERSHIP = obj({"group_id": LONG, "added_at": DATE})

MEMBERS = CollectionSpec(
    name="members",
    schema=document(
        {
            "organization_id": LONG,
            "user_id": LONG,
            "display_name": STRING,
            "email": varchar(254, null=True),
            "phone": varchar(32, null=True),
            "job_title": varchar(120, null=True),
            "avatar_url": varchar(500, null=True),
            "status": enum(MEMBER_STATUSES),
            "created_at": DATE,
            "joined_at": OPT_DATE,
            "groups": array_of(GROUP_MEMBERSHIP, max_items=50),
            "role_grants": array_of(ROLE_GRANT, max_items=100),
            "version": INT,
        }
    ),
    rules=[
        implies({"$eq": ["$status", "active"]}, is_set("$joined_at")),
        distinct("$groups.group_id"),
        distinct("$role_grants._id"),
        distinct_role_grants("$role_grants"),
    ],
    indexes=[
        IndexModel([("organization_id", 1), ("user_id", 1)], unique=True),
        IndexModel([("user_id", 1)]),
        IndexModel([("organization_id", 1), ("groups.group_id", 1)]),
        IndexModel([("organization_id", 1), ("role_grants.project_id", 1)]),
        IndexModel(
            [
                ("organization_id", 1),
                ("display_name", "text"),
                ("email", "text"),
                ("job_title", "text"),
            ],
            default_language="none",
        ),
    ],
)
