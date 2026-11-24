from app.shared.adapter.outbound.object_relational_db.objects import Domain, Statement, value_rule
from app.shared.core.domain.value_objects.position import Position

# done_by_id has no FK: an element of an array cannot reference a table.
CHECKLIST_ITEM_TYPE = Statement(
    name="checklist_item_t",
    depends_on=("position_d",),
    sql="""
CREATE TYPE checklist_item_t AS (
    id bigint, checklist_title text, element text, "order" position_d,
    done_by_id bigint, done_at timestamptz, created_at timestamptz, updated_at timestamptz)
""",
)

CHECKLIST_ITEM = Domain(
    name="checklist_item_d",
    base="checklist_item_t",
    depends_on=("checklist_item_t",),
    check=f"""
    (VALUE).id IS NOT NULL AND (VALUE).element IS NOT NULL
    AND (VALUE)."order" IS NOT NULL AND {value_rule(Position, '(VALUE)."order"')}
    AND (VALUE).created_at IS NOT NULL AND (VALUE).updated_at IS NOT NULL
    AND ((VALUE).done_by_id IS NULL) = ((VALUE).done_at IS NULL)""",
)

CHECKLIST_IDS_UNIQUE = Statement(
    name="checklist_ids_unique",
    depends_on=("checklist_item_d",),
    sql="""
CREATE FUNCTION checklist_ids_unique(items checklist_item_d[]) RETURNS boolean
LANGUAGE sql IMMUTABLE AS $$
    SELECT count(DISTINCT (items[i]).id) = cardinality(items) FROM generate_subscripts(items, 1) AS i $$
""",
)
