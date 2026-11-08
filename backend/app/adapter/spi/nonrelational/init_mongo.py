"""Create or update collection validators and indexes.

Usage (from backend/): python -m app.adapter.spi.nonrelational.init_mongo
"""

import os
from typing import Any

from pymongo import IndexModel, MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import OperationFailure

from app.adapter.spi.nonrelational.models import COLLECTIONS

INDEX_CONFLICT_CODES = {85, 86}  # IndexOptionsConflict, IndexKeySpecsConflict


def sync_indexes(collection: Collection[dict[str, object]], indexes: list[IndexModel]) -> None:
    """Drop indexes the spec no longer has and rebuild those whose options changed."""
    wanted = {index.document["name"] for index in indexes}
    for name in collection.index_information():
        if name != "_id_" and name not in wanted:
            collection.drop_index(name)
    for index in indexes:
        try:
            collection.create_indexes([index])
        except OperationFailure as error:
            if error.code not in INDEX_CONFLICT_CODES:
                raise
            collection.drop_index(index.document["name"])
            collection.create_indexes([index])


def init_mongo(db: Database[dict[str, object]]) -> None:
    existing = set(db.list_collection_names())
    for spec in COLLECTIONS:
        options: dict[str, Any] = {
            "validator": spec.validator,
            "validationLevel": "strict",
            "validationAction": "error",
        }
        if spec.name in existing:
            db.command("collMod", spec.name, **options)
        else:
            db.create_collection(spec.name, **options)
        sync_indexes(db[spec.name], spec.indexes)


def main() -> None:
    client: MongoClient[dict[str, object]] = MongoClient(
        os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    )
    with client:
        init_mongo(client[os.environ.get("MONGO_DB", "promt")])


if __name__ == "__main__":
    main()
