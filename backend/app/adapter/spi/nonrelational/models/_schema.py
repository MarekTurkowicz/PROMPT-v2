from dataclasses import dataclass, field
from typing import Any

from pymongo import IndexModel

Schema = dict[str, Any]
Expr = dict[str, Any]

STATUS_CATEGORIES = ["todo", "in_progress", "done", "cancelled"]
CURRENCY_PATTERN = "^[A-Z]{3}$"
COLOR_PATTERN = "^#[0-9A-Fa-f]{6}$"


@dataclass(frozen=True)
class CollectionSpec:
    name: str
    schema: Schema
    rules: list[Expr] = field(default_factory=list)
    indexes: list[IndexModel] = field(default_factory=list)

    @property
    def validator(self) -> Schema:
        validator: Schema = {"$jsonSchema": self.schema}
        if self.rules:
            validator["$expr"] = {"$and": self.rules}
        return validator


def bson(bson_type: str | list[str], **constraints: Any) -> Schema:
    return {"bsonType": bson_type, **constraints}


def nullable(bson_type: str | list[str], **constraints: Any) -> Schema:
    bson_types = [bson_type] if isinstance(bson_type, str) else bson_type
    return {"bsonType": [*bson_types, "null"], **constraints}


def enum(values: list[str]) -> Schema:
    return {"bsonType": "string", "enum": values}


def nullable_enum(values: list[str]) -> Schema:
    return {"bsonType": ["string", "null"], "enum": [*values, None]}


def _accepts_null(schema: Schema) -> bool:
    bson_type = schema.get("bsonType")
    return isinstance(bson_type, list) and "null" in bson_type


def obj(properties: Schema, *, null: bool = False) -> Schema:
    """Closed object; a property is required unless its type accepts null (``typ?``)."""
    schema: Schema = {
        "bsonType": ["object", "null"] if null else "object",
        "additionalProperties": False,
        "properties": properties,
    }
    required = [name for name, prop in properties.items() if not _accepts_null(prop)]
    if required:
        schema["required"] = required
    return schema


def array_of(items: Schema, max_items: int | None = None, **constraints: Any) -> Schema:
    schema: Schema = {"bsonType": "array", "items": items, **constraints}
    if max_items is not None:
        schema["maxItems"] = max_items
    return schema


def document(properties: Schema) -> Schema:
    return obj({"_id": LONG, **properties})


LONG = bson(["int", "long"])
INT = bson("int")
STRING = bson("string")
BOOL = bson("bool")
DATE = bson("date")
DECIMAL = bson("decimal")
POSITIVE_DECIMAL = bson("decimal", minimum=0, exclusiveMinimum=True)
OPT_LONG = nullable(["int", "long"])
OPT_INT = nullable("int")
OPT_STRING = nullable("string")
OPT_DATE = nullable("date")
PRIORITY = bson("int", minimum=1, maximum=5)

MONEY = obj({"value": POSITIVE_DECIMAL, "currency": bson("string", pattern=CURRENCY_PATTERN)})

STATUS = obj(
    {
        "_id": LONG,
        "category": enum(STATUS_CATEGORIES),
        "name": STRING,
        "color": bson("string", pattern=COLOR_PATTERN),
        "position": INT,
        "is_default": BOOL,
        "is_active": BOOL,
    }
)

ROLE_GRANT = obj(
    {
        "_id": LONG,
        "role_id": LONG,
        "project_id": OPT_LONG,
        "created_at": DATE,
        "updated_at": DATE,
    }
)


MAX_ATTACHMENT_SIZE_BYTES = 50 * 1024 * 1024


def attachment(max_size_bytes: int = MAX_ATTACHMENT_SIZE_BYTES) -> Schema:
    size = bson(
        ["int", "long"],
        minimum=0,
        exclusiveMinimum=True,
        maximum=max_size_bytes,
    )
    return obj(
        {
            "_id": LONG,
            "uploaded_by": LONG,
            "file": STRING,
            "original_name": STRING,
            "mime_type": STRING,
            "size_bytes": size,
            "created_at": DATE,
        }
    )


def is_set(path: str) -> Expr:
    return {"$ne": [{"$ifNull": [path, None]}, None]}


def is_unset(path: str) -> Expr:
    return {"$eq": [{"$ifNull": [path, None]}, None]}


def implies(condition: Expr, consequence: Expr) -> Expr:
    return {"$or": [{"$not": [condition]}, consequence]}


def both_or_neither(a: str, b: str) -> Expr:
    return {"$eq": [is_set(a), is_set(b)]}


def not_before(later: str, earlier: str) -> Expr:
    """``later >= earlier``; passes when either side is missing or null."""
    return {"$or": [is_unset(later), is_unset(earlier), {"$gte": [later, earlier]}]}


def every(array: str, alias: str, condition: Expr) -> Expr:
    return {
        "$allElementsTrue": [
            {"$map": {"input": {"$ifNull": [array, []]}, "as": alias, "in": condition}}
        ]
    }
