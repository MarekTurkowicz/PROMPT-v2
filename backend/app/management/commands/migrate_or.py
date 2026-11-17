from typing import Any

from django.core.management.base import BaseCommand

from app.object_relational_schema import MIGRATIONS
from app.shared.adapter.outbound.object_relational_db.migrate import apply_migrations, connect_from_env


class Command(BaseCommand):
    help = "Create or update the object-relational schema in the OR_DB_NAME database"

    def handle(self, *args: Any, **options: Any) -> None:
        conn = connect_from_env()
        try:
            applied = apply_migrations(conn, MIGRATIONS)
        finally:
            conn.close()
        if applied:
            self.stdout.write(self.style.SUCCESS(f"Applied versions: {applied}"))
        else:
            self.stdout.write("Object-relational schema is up to date")
