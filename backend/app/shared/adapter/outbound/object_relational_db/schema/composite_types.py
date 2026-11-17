from app.shared.adapter.outbound.object_relational_db.schema.objects import Domain, Statement

# Fields of a composite type cannot be NOT NULL or have a CHECK, so a domain wraps each type.
# A NULL field skips the field domain's CHECK, so the wrapping domain repeats the rules.

MONEY_TYPE = Statement(
    name="money_t",
    depends_on=("currency_d",),
    sql="CREATE TYPE money_t AS (amount numeric(14,2), currency currency_d)",
)

# Amount and currency always go together (funding.amount_total, expense.amount).
MONEY = Domain(
    name="money_d",
    base="money_t",
    depends_on=("money_t",),
    check="""
    (VALUE).amount IS NOT NULL AND (VALUE).currency IS NOT NULL
    AND (VALUE).amount > 0 AND (VALUE).currency ~ '^[A-Z]{3}$'""",
)
