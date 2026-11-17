from app.shared.adapter.outbound.object_relational_db.schema.objects import Domain

# Loose on purpose: Django also accepts addresses like admin@localhost.
EMAIL = Domain(name="email_d", base="varchar(254)", check=r"VALUE ~ '^[^@\s]+@[^@\s]+$'")

# Order on a board or a list (task_status, milestone, checklist item); PositiveSmallIntegerField in Django.
POSITION = Domain(name="position_d", base="smallint", check="VALUE >= 0")

# Priority 1 (lowest) .. 5 (highest), as Priority in api/constants.py (task, task_template).
PRIORITY = Domain(name="priority_d", base="smallint", check="VALUE BETWEEN 1 AND 5")

# Estimated hours (task, task_template).
EST_HOURS = Domain(name="est_hours_d", base="numeric(6,2)", check="VALUE > 0")

# ISO 4217 code, the same regex as CURRENCY_CODE of the relational model.
CURRENCY = Domain(name="currency_d", base="char(3)", check="VALUE ~ '^[A-Z]{3}$'")

# Attachment size in bytes, 1 B .. 50 MiB (MAX_ATTACHMENT_SIZE of the relational model).
FILE_SIZE = Domain(name="file_size_d", base="bigint", check="VALUE > 0 AND VALUE <= 52428800")

# Key-value documents (organization.settings, notification.content); arrays and scalars are rejected.
JSON_OBJECT = Domain(name="json_object_d", base="jsonb", check="jsonb_typeof(VALUE) = 'object'")
