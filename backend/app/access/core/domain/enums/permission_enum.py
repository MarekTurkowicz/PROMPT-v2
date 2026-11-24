from enum import StrEnum


class PermissionEnum(StrEnum):
    CREATE_ORGANIZATION = "organization.create_organization"
    UPDATE_ORGANIZATION_SETTINGS = "organization.update_organization_settings"
    ADD_ORGANIZATION_MEMBER = "organization.add_organization_member"
