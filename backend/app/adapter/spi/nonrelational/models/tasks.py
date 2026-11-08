from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    INT,
    LONG,
    OPT_DATE,
    OPT_LONG,
    POSITION,
    PRESENT_ID,
    PRIORITY,
    STATUS_CATEGORIES,
    STRING,
    CollectionSpec,
    array_of,
    attachment,
    both_or_neither,
    distinct,
    document,
    enum,
    every,
    not_before,
    numeric,
    obj,
    varchar,
)

ASSIGNMENT = obj(
    {
        "_id": LONG,
        "member_id": LONG,
        "assigned_by": OPT_LONG,
        "assigned_at": DATE,
        "started_at": OPT_DATE,
        "finished_at": OPT_DATE,
        "removed_at": OPT_DATE,
    }
)

CHECKLIST_ITEM = obj(
    {
        "_id": LONG,
        "checklist_title": varchar(120, null=True),
        "element": varchar(300),
        "order": POSITION,
        "done_by": OPT_LONG,
        "done_at": OPT_DATE,
        "created_at": DATE,
        "updated_at": DATE,
    }
)

TASK_SCHEMA = document(
    {
        "organization_id": LONG,
        "project_id": LONG,
        "project_funding_id": OPT_LONG,
        "milestone_id": OPT_LONG,
        "parent_id": OPT_LONG,
        "template_id": OPT_LONG,
        "status_id": LONG,
        "status_category": enum(STATUS_CATEGORIES),
        "group_id": OPT_LONG,
        "title": varchar(200),
        "description": STRING,
        "priority": PRIORITY,
        "start_date": OPT_DATE,
        "due_date": OPT_DATE,
        "est_hours": numeric(6, 2, null=True),
        "created_by": LONG,
        "assignments": array_of(ASSIGNMENT, max_items=50),
        "checklist": array_of(CHECKLIST_ITEM, max_items=200),
        "attachments": array_of(attachment(), max_items=50),
        "created_at": DATE,
        "updated_at": DATE,
        "version": INT,
    }
)

TASKS = CollectionSpec(
    name="tasks",
    schema=TASK_SCHEMA,
    rules=[
        not_before("$due_date", "$start_date"),
        distinct("$assignments.member_id"),
        every("$assignments", "a", not_before("$$a.finished_at", "$$a.started_at")),
        every("$checklist", "c", both_or_neither("$$c.done_by", "$$c.done_at")),
    ],
    indexes=[
        IndexModel([("organization_id", 1), ("project_id", 1), ("status_id", 1), ("priority", -1)]),
        IndexModel([("organization_id", 1), ("assignments.member_id", 1), ("due_date", 1)]),
        IndexModel(
            [("organization_id", 1), ("due_date", 1)],
            partialFilterExpression={"status_category": {"$in": ["todo", "in_progress"]}},
        ),
        IndexModel([("organization_id", 1), ("project_id", 1), ("start_date", 1), ("due_date", 1)]),
        IndexModel(
            [("organization_id", 1), ("project_funding_id", 1)],
            partialFilterExpression={"project_funding_id": PRESENT_ID},
        ),
        IndexModel(
            [("organization_id", 1), ("parent_id", 1)],
            partialFilterExpression={"parent_id": PRESENT_ID},
        ),
        IndexModel(
            [("organization_id", 1), ("group_id", 1)],
            partialFilterExpression={"group_id": PRESENT_ID},
        ),
        IndexModel(
            [("organization_id", 1), ("project_funding_id", 1), ("template_id", 1)],
            unique=True,
            partialFilterExpression={"project_funding_id": PRESENT_ID, "template_id": PRESENT_ID},
        ),
    ],
)
