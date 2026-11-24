from django.db import connection

from app.access.core.domain.entities.organization_access import OrganizationAccess
from app.access.core.domain.enums.permission_enum import PermissionEnum
from app.access.core.ports.spi.db.repositories.organization_access_port import (
    OrganizationAccessPort,
)
from app.organization.core.domain.value_objects.member_status import MemberStatus

# Only organization-wide grants (project_id IS NULL) count; UNION in the recursive part stops on group cycles.
ORGANIZATION_ACCESS_QUERY = """
WITH RECURSIVE
member AS (
    SELECT om.id, om.status
    FROM organization_member AS om
    JOIN organization AS o ON o.id = om.organization_id
    WHERE om.organization_id = %(organization_id)s
      AND om.user_id = %(user_id)s
      AND o.is_active
),
member_groups AS (
    SELECT g.id, g.parent_id
    FROM member_group AS g
    JOIN member_group_member AS mgm ON mgm.group_id = g.id
    JOIN member AS m ON m.id = mgm.member_id
    UNION
    SELECT parent.id, parent.parent_id
    FROM member_group AS parent
    JOIN member_groups AS child ON child.parent_id = parent.id
)
SELECT
    m.status,
    COALESCE(
        ARRAY_AGG(DISTINCT permission) FILTER (WHERE permission IS NOT NULL),
        ARRAY[]::varchar[]
    )
FROM member AS m
LEFT JOIN role_assignment AS ra
    ON ra.project_id IS NULL
   AND (ra.member_id = m.id OR ra.group_id IN (SELECT id FROM member_groups))
LEFT JOIN role AS r
    ON r.id = ra.role_id
   AND r.organization_id = %(organization_id)s
LEFT JOIN LATERAL UNNEST(r.permissions) AS permission ON TRUE
GROUP BY m.status
"""

KNOWN_PERMISSIONS = frozenset(PermissionEnum)


class OrganizationAccessRepository(OrganizationAccessPort):
    def get_organization_access(self, user_id: int, organization_id: int) -> OrganizationAccess | None:
        with connection.cursor() as cursor:
            cursor.execute(
                ORGANIZATION_ACCESS_QUERY,
                {"user_id": user_id, "organization_id": organization_id},
            )
            row = cursor.fetchone()
        if row is None:
            return None

        status, permissions = row
        return OrganizationAccess(
            is_active_member=status == MemberStatus.ACTIVE,
            permissions=frozenset(
                PermissionEnum(permission) for permission in permissions if permission in KNOWN_PERMISSIONS
            ),
        )
