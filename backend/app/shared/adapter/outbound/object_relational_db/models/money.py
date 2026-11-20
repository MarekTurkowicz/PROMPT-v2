from app.shared.adapter.outbound.object_relational_db.objects import Domain, Statement, value_rule
from app.shared.core.domain.constraints.money import Currency, Money

CURRENCY = Domain.from_value_object("currency_d", "text", Currency)

MONEY_TYPE = Statement(
    name="money_t",
    depends_on=("currency_d",),
    sql="CREATE TYPE money_t AS (amount numeric(14,2), currency currency_d)",
)

MONEY = Domain(
    name="money_d",
    base="money_t",
    depends_on=("money_t",),
    check=f"""
    (VALUE).amount IS NOT NULL AND (VALUE).currency IS NOT NULL
    AND {value_rule(Money, "(VALUE).amount", numeric=True)}
    AND {value_rule(Currency, "(VALUE).currency")}""",
)
