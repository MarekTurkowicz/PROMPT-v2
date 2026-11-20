from enum import StrEnum


class EntityType(StrEnum):
    ORGANIZATION = "organization"
    ORGANIZATION_MEMBER = "organization_member"
    MEMBER_GROUP = "member_group"
    ROLE = "role"
    ROLE_ASSIGNMENT = "role_assignment"
    TASK_STATUS = "task_status"
    PROJECT = "project"
    MILESTONE = "milestone"
    FUNDING = "funding"
    PROJECT_FUNDING = "project_funding"
    TASK_TEMPLATE = "task_template"
    TASK = "task"
    TASK_ASSIGNMENT = "task_assignment"
    TIME_ENTRY = "time_entry"
    CHECKLIST_ITEM = "checklist_item"
    COMMENT = "comment"
    ATTACHMENT = "attachment"
    EXPENSE = "expense"
