from app.shared.adapter.outbound.object_relational_db.schema.objects import Domain

# Loose on purpose: Django also accepts addresses like admin@localhost.
EMAIL = Domain(name="email_d", base="varchar(254)", check=r"VALUE ~ '^[^@\s]+@[^@\s]+$'")

# Order on a board or a list (task_status, milestone, checklist item); PositiveSmallIntegerField in Django.
POSITION = Domain(name="position_d", base="smallint", check="VALUE >= 0")

# ISO 4217 code, the same regex as CURRENCY_CODE of the relational model.
CURRENCY = Domain(name="currency_d", base="char(3)", check="VALUE ~ '^[A-Z]{3}$'")

# Key-value documents (organization.settings, notification.content); arrays and scalars are rejected.
JSON_OBJECT = Domain(name="json_object_d", base="jsonb", check="jsonb_typeof(VALUE) = 'object'")
