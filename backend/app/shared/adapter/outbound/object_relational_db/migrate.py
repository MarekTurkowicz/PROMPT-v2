import os
from collections.abc import Mapping, Sequence

import psycopg2
from django.conf import settings
from psycopg2.extensions import connection

from app.shared.adapter.outbound.object_relational_db.schema.objects import SchemaObject

CREATE_SCHEMA_VERSION = """
CREATE TABLE IF NOT EXISTS schema_version (
    version     integer PRIMARY KEY,
    applied_at  timestamptz NOT NULL
)
"""

# Two migrate_or runs at the same time (e.g. two containers) wait for each other.
LOCK_KEY = 52_052


def connect_from_env(dbname: str | None = None) -> connection:
    """OR_DB_* variables; user, password, host and port default to the main database."""
    default = settings.DATABASES["default"]
    return psycopg2.connect(
        dbname=dbname or os.getenv("OR_DB_NAME", "promt_or"),
        user=os.getenv("OR_DB_USER", default["USER"]),
        password=os.getenv("OR_DB_PASSWORD", default["PASSWORD"]),
        host=os.getenv("OR_DB_HOST", default["HOST"]),
        port=os.getenv("OR_DB_PORT", default["PORT"]),
    )


def apply_migrations(conn: connection, migrations: Mapping[int, Sequence[SchemaObject]]) -> list[int]:
    applied: list[int] = []
    for version in sorted(migrations):
        with conn, conn.cursor() as cursor:
            cursor.execute("SELECT pg_advisory_xact_lock(%s)", (LOCK_KEY,))
            cursor.execute(CREATE_SCHEMA_VERSION)
            cursor.execute("SELECT 1 FROM schema_version WHERE version = %s", (version,))
            if cursor.fetchone() is not None:
                continue
            cursor.execute("\n\n".join(obj.create_sql() for obj in migrations[version]))
            cursor.execute("INSERT INTO schema_version VALUES (%s, now())", (version,))
        applied.append(version)
    return applied
