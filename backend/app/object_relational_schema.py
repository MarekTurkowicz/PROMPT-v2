from app.access.adapter.outbound.object_relational_db.schema.role import (
    PERMISSION_CODE,
    PERMISSION_CODES_DISTINCT,
    PERMISSION_SET,
    ROLE,
)
from app.access.adapter.outbound.object_relational_db.schema.user import LOGIN_EMAIL, USER
from app.organization.adapter.outbound.object_relational_db.schema.member_group import MEMBER_GROUP
from app.organization.adapter.outbound.object_relational_db.schema.member_group_member import (
    MEMBER_GROUP_MEMBER,
)
from app.organization.adapter.outbound.object_relational_db.schema.organization import ORGANIZATION
from app.organization.adapter.outbound.object_relational_db.schema.organization_member import (
    MEMBER_STATUS,
    ORGANIZATION_MEMBER,
)
from app.shared.adapter.outbound.object_relational_db.schema.domains import EMAIL, JSON_OBJECT
from app.shared.adapter.outbound.object_relational_db.schema.objects import SchemaObject

# All objects of the object-relational schema in creation order (like app/models.py).
SCHEMA_OBJECTS: tuple[SchemaObject, ...] = (
    EMAIL,
    LOGIN_EMAIL,
    USER,
    JSON_OBJECT,
    ORGANIZATION,
    MEMBER_STATUS,
    ORGANIZATION_MEMBER,
    MEMBER_GROUP,
    MEMBER_GROUP_MEMBER,
    PERMISSION_CODE,
    PERMISSION_CODES_DISTINCT,
    PERMISSION_SET,
    ROLE,
)
