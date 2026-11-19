from app.shared.adapter.outbound.object_relational_db.schema.objects import Domain, Statement

# Fields of a composite type cannot be NOT NULL or have a CHECK, so a domain wraps each type.
# A NULL field skips the field domain's CHECK, so the wrapping domain repeats the rules.

MONEY_TYPE = Statement(
    name="money_t",
    depends_on=("currency_d",),
    sql="CREATE TYPE money_t AS (amount numeric(14,2), currency currency_d)",
)

MONEY = Domain(
    name="money_d",
    base="money_t",
    depends_on=("money_t",),
    check="""
    (VALUE).amount IS NOT NULL AND (VALUE).currency IS NOT NULL
    AND (VALUE).amount > 0 AND (VALUE).amount <> 'NaN' AND (VALUE).currency ~ '^[A-Z]{3}$'""",
)

# uploaded_by_id has no FK: an element of an array cannot reference a table.
ATTACHMENT_TYPE = Statement(
    name="attachment_t",
    depends_on=("file_size_d",),
    sql="""
CREATE TYPE attachment_t AS (
    id bigint, file varchar(500), original_name varchar(255), mime_type varchar(100),
    size_bytes file_size_d, uploaded_by_id bigint, created_at timestamptz)
""",
)

ATTACHMENT = Domain(
    name="attachment_d",
    base="attachment_t",
    depends_on=("attachment_t",),
    check="""
    (VALUE).id IS NOT NULL AND (VALUE).file IS NOT NULL AND (VALUE).original_name IS NOT NULL
    AND (VALUE).mime_type IS NOT NULL AND (VALUE).uploaded_by_id IS NOT NULL
    AND (VALUE).created_at IS NOT NULL
    AND (VALUE).size_bytes IS NOT NULL AND (VALUE).size_bytes > 0 AND (VALUE).size_bytes <= 52428800""",
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
