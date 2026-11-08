from pymongo import IndexModel

from app.adapter.spi.nonrelational.models._schema import (
    DATE,
    LONG,
    OPT_LONG,
    CollectionSpec,
    array_of,
    attachment,
    bson,
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
        "attachments": array_of(attachment(), max_items=20),
        "created_at": DATE,
        "updated_at": DATE,
    }
)
COMMENT_SCHEMA["oneOf"] = [
    {"required": ["task_id"], "properties": {"task_id": LONG}},
    {"required": ["project_id"], "properties": {"project_id": LONG}},
]

COMMENTS = CollectionSpec(
    name="comments",
    schema=COMMENT_SCHEMA,
    indexes=[
        IndexModel(
            [("organization_id", 1), ("task_id", 1), ("created_at", 1)],
            partialFilterExpression={"task_id": {"$type": "long"}},
        ),
        IndexModel(
            [("organization_id", 1), ("project_id", 1), ("created_at", 1)],
            partialFilterExpression={"project_id": {"$type": "long"}},
        ),
    ],
)
