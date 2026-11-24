from dataclasses import dataclass

from app.access.core.domain.enums.permission_enum import PermissionEnum


@dataclass(frozen=True, slots=True)
class OrganizationAccess:
    is_active_member: bool
    permissions: frozenset[PermissionEnum]
