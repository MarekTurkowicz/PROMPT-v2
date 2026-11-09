import os
from typing import Any

from django.core.management.base import BaseCommand
from pymongo import MongoClient

from app.adapter.spi.nonrelational.init_mongo import init_mongo

DEFAULT_MONGO_URL = "mongodb://localhost:27017/?replicaSet=rs0&directConnection=true"


class Command(BaseCommand):
    help = "Create or update MongoDB collections, validators and indexes (idempotent)"

    def handle(self, *args: Any, **options: Any) -> None:
        database = os.environ.get("MONGO_DB", "promt")
        client: MongoClient[dict[str, object]] = MongoClient(
            os.environ.get("MONGO_URL", DEFAULT_MONGO_URL)
        )
        with client:
            init_mongo(client[database])
        self.stdout.write(f"MongoDB schema is up to date in database {database!r}")
