"""Create or update collection validators and indexes.

Usage (from backend/): python -m app.adapter.spi.nonrelational.init_mongo
"""

import os
from typing import Any

from pymongo import MongoClient
from pymongo.database import Database

from app.adapter.spi.nonrelational.models import COLLECTIONS


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
        if spec.indexes:
            db[spec.name].create_indexes(spec.indexes)


def main() -> None:
    client: MongoClient[dict[str, object]] = MongoClient(
        os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    )
    with client:
        init_mongo(client[os.environ.get("MONGO_DB", "promt")])


if __name__ == "__main__":
    main()
