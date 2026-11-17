from app.access.adapter.outbound.object_relational_db.schema.user import LOGIN_EMAIL, USER
from app.organization.adapter.outbound.object_relational_db.schema.organization import ORGANIZATION
from app.shared.adapter.outbound.object_relational_db.schema.domains import EMAIL, JSON_OBJECT
from app.shared.adapter.outbound.object_relational_db.schema.objects import SchemaObject

# All objects of the object-relational schema in creation order (like app/models.py).
SCHEMA_OBJECTS: tuple[SchemaObject, ...] = (
    EMAIL,
    LOGIN_EMAIL,
    USER,
    JSON_OBJECT,
    ORGANIZATION,
)
