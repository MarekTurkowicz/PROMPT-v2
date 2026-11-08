from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    LONG,
    OPT_DATE,
    OPT_LONG,
    CollectionSpec,
    bson,
    document,
    enum,
)

ENTITY_TYPES = [
    "organization",
    "organization_member",
    "member_group",
    "role",
    "role_assignment",
    "task_status",
    "project",
    "milestone",
    "funding",
    "project_funding",
    "task_template",
    "task",
    "task_assignment",
    "time_entry",
    "checklist_item",
    "comment",
    "attachment",
    "expense",
]

ACTIONS = [
    "created",
    "updated",
    "deleted",
    "status_changed",
    "rescheduled",
    "assigned",
    "unassigned",
    "granted",
    "revoked",
    "attached",
    "detached",
    "checked",
    "unchecked",
    "added_to_group",
    "removed_from_group",
    "invited",
    "reminder_sent",
    "moved",
    "hidden",
    "shown",
    "archived",
    "restored",
    "alert_raised",
    "alert_resolved",
]

ACTIVITY_LOGS = CollectionSpec(
    name="activity_logs",
    schema=document(
        {
            "organization_id": LONG,
            "project_id": OPT_LONG,
            "actor_id": OPT_LONG,
            "entity_type": enum(ENTITY_TYPES),
            "entity_id": LONG,
            "action": enum(ACTIONS),
            "changes": bson("object"),
            "created_at": DATE,
            "expires_at": OPT_DATE,
        }
    ),
    indexes=[
        IndexModel(
            [("organization_id", 1), ("entity_type", 1), ("entity_id", 1), ("created_at", -1)]
        ),
        IndexModel([("organization_id", 1), ("created_at", -1)]),
        IndexModel(
            [("organization_id", 1), ("project_id", 1), ("created_at", -1)],
            partialFilterExpression={"project_id": {"$type": "long"}},
        ),
        IndexModel([("expires_at", 1)], expireAfterSeconds=0),
    ],
)
