from app.shared.adapter.outbound.object_relational_db.schema.objects import Domain

POSITION = Domain(name="position_d", base="smallint", check="VALUE >= 0")

PRIORITY = Domain(name="priority_d", base="smallint", check="VALUE BETWEEN 1 AND 5")

EST_HOURS = Domain(name="est_hours_d", base="numeric(6,2)", check="VALUE > 0")

CURRENCY = Domain(name="currency_d", base="char(3)", check="VALUE ~ '^[A-Z]{3}$'")

FILE_SIZE = Domain(name="file_size_d", base="bigint", check="VALUE > 0 AND VALUE <= 52428800")
