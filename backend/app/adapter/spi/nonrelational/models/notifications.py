from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    LONG,
    OPT_DATE,
    OPT_LONG,
    OPT_STRING,
    PRESENT_ID,
    PRESENT_STRING,
    STRING,
    CollectionSpec,
    document,
    enum,
    is_set,
    obj,
)

NOTIFICATION_KINDS = ["event", "due_soon", "overdue", "alert"]

NOTIFICATIONS = CollectionSpec(
    name="notifications",
    schema=document(
        {
            "recipient_user_id": LONG,
            "organization_id": OPT_LONG,  # pending CORE-2 decision (#72)
            "activity_id": OPT_LONG,
            "kind": enum(NOTIFICATION_KINDS),
            "dedup_key": OPT_STRING,
            "content": obj({"title": STRING, "body": STRING, "link": OPT_STRING}, null=True),
            "read_at": OPT_DATE,
            "created_at": DATE,
        }
    ),
    rules=[{"$eq": [{"$eq": ["$kind", "event"]}, is_set("$activity_id")]}],
    indexes=[
        IndexModel(
            [("recipient_user_id", 1), ("activity_id", 1)],
            unique=True,
            partialFilterExpression={"activity_id": PRESENT_ID},
        ),
        IndexModel(
            [("recipient_user_id", 1), ("dedup_key", 1)],
            unique=True,
            partialFilterExpression={"dedup_key": PRESENT_STRING},
        ),
        IndexModel([("recipient_user_id", 1), ("read_at", 1), ("created_at", -1)]),
        IndexModel([("recipient_user_id", 1), ("created_at", -1)]),
    ],
)
