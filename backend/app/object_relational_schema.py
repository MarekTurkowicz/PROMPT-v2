from app.access.adapter.outbound.object_relational_db.schema.role import (
    PERMISSION_CODE,
    PERMISSION_CODES_DISTINCT,
    PERMISSION_SET,
    ROLE,
)
from app.access.adapter.outbound.object_relational_db.schema.role_assignment import ROLE_ASSIGNMENT
from app.access.adapter.outbound.object_relational_db.schema.user import LOGIN_EMAIL, USER
from app.finance.adapter.outbound.object_relational_db.schema.funding import FUNDING, FUNDING_TYPE
from app.finance.adapter.outbound.object_relational_db.schema.project_funding import (
    PROJECT_FUNDING,
    PROJECT_FUNDING_ONE_PRIMARY,
    PROJECT_FUNDING_UNIQUE,
)
from app.organization.adapter.outbound.object_relational_db.schema.member_group import MEMBER_GROUP
from app.organization.adapter.outbound.object_relational_db.schema.member_group_member import (
    MEMBER_GROUP_MEMBER,
)
from app.organization.adapter.outbound.object_relational_db.schema.organization import ORGANIZATION
from app.organization.adapter.outbound.object_relational_db.schema.organization_member import (
    MEMBER_STATUS,
    ORGANIZATION_MEMBER,
)
from app.project.adapter.outbound.object_relational_db.schema.milestone import MILESTONE, MILESTONE_STATUS
from app.project.adapter.outbound.object_relational_db.schema.project import PROJECT, PROJECT_STATUS
from app.project.adapter.outbound.object_relational_db.schema.task_status import (
    COLOR,
    STATUS_CATEGORY,
    TASK_STATUS,
    TASK_STATUS_ONE_DEFAULT_IN_ORG,
)
from app.shared.adapter.outbound.object_relational_db.schema.composite_types import MONEY, MONEY_TYPE
from app.shared.adapter.outbound.object_relational_db.schema.domains import (
    CURRENCY,
    EMAIL,
    JSON_OBJECT,
    POSITION,
)
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
    PROJECT_STATUS,
    PROJECT,
    ROLE_ASSIGNMENT,
    POSITION,
    STATUS_CATEGORY,
    COLOR,
    TASK_STATUS,
    TASK_STATUS_ONE_DEFAULT_IN_ORG,
    MILESTONE_STATUS,
    MILESTONE,
    CURRENCY,
    MONEY_TYPE,
    MONEY,
    FUNDING_TYPE,
    FUNDING,
    PROJECT_FUNDING,
    PROJECT_FUNDING_UNIQUE,
    PROJECT_FUNDING_ONE_PRIMARY,
)
