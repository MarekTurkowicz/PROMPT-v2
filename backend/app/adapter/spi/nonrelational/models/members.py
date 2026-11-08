from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    INT,
    LONG,
    OPT_DATE,
    OPT_STRING,
    ROLE_GRANT,
    STRING,
    CollectionSpec,
    array_of,
    document,
    enum,
    implies,
    is_set,
    obj,
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
            "email": OPT_STRING,
            "phone": OPT_STRING,
            "job_title": OPT_STRING,
            "avatar_url": OPT_STRING,
            "status": enum(MEMBER_STATUSES),
            "created_at": DATE,
            "joined_at": OPT_DATE,
            "groups": array_of(GROUP_MEMBERSHIP, max_items=50),
            "role_grants": array_of(ROLE_GRANT, max_items=100),
            "version": INT,
        }
    ),
    rules=[implies({"$eq": ["$status", "active"]}, is_set("$joined_at"))],
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
