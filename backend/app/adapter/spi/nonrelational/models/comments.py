from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    ATTACHMENT,
    DATE,
    INT,
    LONG,
    OPT_LONG,
    PRESENT_ID,
    CollectionSpec,
    array_of,
    bson,
    distinct,
    document,
)

COMMENT_SCHEMA = document(
    {
        "organization_id": LONG,
        "task_id": OPT_LONG,
        "project_id": OPT_LONG,
        "parent_id": OPT_LONG,
        "author_id": LONG,
        "content": bson("string", minLength=1),
        "attachments": array_of(ATTACHMENT),
        "created_at": DATE,
        "updated_at": DATE,
        "version": INT,
    }
)
COMMENT_SCHEMA["oneOf"] = [
    {"required": ["task_id"], "properties": {"task_id": LONG}},
    {"required": ["project_id"], "properties": {"project_id": LONG}},
]

COMMENTS = CollectionSpec(
    name="comments",
    schema=COMMENT_SCHEMA,
    rules=[distinct("$attachments._id")],
    indexes=[
        IndexModel(
            [("organization_id", 1), ("task_id", 1), ("created_at", 1)],
            partialFilterExpression={"task_id": PRESENT_ID},
        ),
        IndexModel(
            [("organization_id", 1), ("project_id", 1), ("created_at", 1)],
            partialFilterExpression={"project_id": PRESENT_ID},
        ),
    ],
)
