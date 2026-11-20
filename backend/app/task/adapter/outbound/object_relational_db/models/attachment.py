from app.shared.adapter.outbound.object_relational_db.objects import Domain, Statement, value_rule
from app.task.core.domain.constraints.file_size import FileSize

FILE_SIZE = Domain.from_value_object("file_size_d", "bigint", FileSize)

# uploaded_by_id has no FK: an element of an array cannot reference a table.
ATTACHMENT_TYPE = Statement(
    name="attachment_t",
    depends_on=("file_size_d",),
    sql="""
CREATE TYPE attachment_t AS (
    id bigint, file text, original_name text, mime_type text,
    size_bytes file_size_d, uploaded_by_id bigint, created_at timestamptz)
""",
)

ATTACHMENT = Domain(
    name="attachment_d",
    base="attachment_t",
    depends_on=("attachment_t",),
    check=f"""
    (VALUE).id IS NOT NULL AND (VALUE).file IS NOT NULL AND (VALUE).original_name IS NOT NULL
    AND (VALUE).mime_type IS NOT NULL AND (VALUE).uploaded_by_id IS NOT NULL
    AND (VALUE).created_at IS NOT NULL
    AND (VALUE).size_bytes IS NOT NULL AND {value_rule(FileSize, "(VALUE).size_bytes")}""",
)

# UNIQUE does not work inside an array, so the ids are checked by an IMMUTABLE function.
ATTACHMENT_IDS_UNIQUE = Statement(
    name="attachment_ids_unique",
    depends_on=("attachment_d",),
    sql="""
CREATE FUNCTION attachment_ids_unique(items attachment_d[]) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
    SELECT count(DISTINCT (items[i]).id) = cardinality(items) FROM generate_subscripts(items, 1) AS i $$
""",
)
