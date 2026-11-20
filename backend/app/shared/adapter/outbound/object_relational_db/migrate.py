from collections.abc import Mapping, Sequence

import psycopg2
from django.conf import settings
from psycopg2.extensions import connection

from app.shared.adapter.outbound.object_relational_db.objects import SchemaObject

CREATE_SCHEMA_VERSION = """
CREATE TABLE IF NOT EXISTS schema_version (
    version     integer PRIMARY KEY,
    applied_at  timestamptz NOT NULL
)
"""

# Two migrate_or runs at the same time (e.g. two containers) wait for each other.
LOCK_KEY = 52_052


def connect(dbname: str | None = None) -> connection:
    db = settings.OBJECT_RELATIONAL_DB
    return psycopg2.connect(
        dbname=dbname or db["NAME"],
        user=db["USER"],
        password=db["PASSWORD"],
        host=db["HOST"],
        port=db["PORT"],
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
