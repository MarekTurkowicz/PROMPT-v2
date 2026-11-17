from app.shared.adapter.outbound.object_relational_db.schema.objects import Domain

# Loose on purpose: Django also accepts addresses like admin@localhost.
EMAIL = Domain(name="email_d", base="varchar(254)", check=r"VALUE ~ '^[^@\s]+@[^@\s]+$'")
