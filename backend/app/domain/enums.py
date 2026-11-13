"""Closed dictionaries of the domain, shared by every adapter (#73)."""

from enum import StrEnum


class StatusCategory(StrEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class MemberStatus(StrEnum):
    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    LEFT = "left"


class Permission(StrEnum):
    # view
    PROJECT_VIEW = "project.view"
    TASK_VIEW = "task.view"
    FUNDING_VIEW = "funding.view"
    BUDGET_VIEW = "budget.view"
    TEAM_VIEW = "team.view"
    REPORT_VIEW = "report.view"
    # tasks
    TASK_CREATE = "task.create"
    TASK_EDIT = "task.edit"
    TASK_DELETE = "task.delete"
    TASK_ASSIGN = "task.assign"
    TASK_PLAN = "task.plan"
    CHECKLIST_EDIT = "checklist.edit"
    TIME_LOG = "time.log"
    COMMENT_CREATE = "comment.create"
    COMMENT_MODERATE = "comment.moderate"
    # project
    PROJECT_CREATE = "project.create"
    PROJECT_EDIT = "project.edit"
    PROJECT_CLOSE = "project.close"
    PROJECT_DELETE = "project.delete"
    MILESTONE_MANAGE = "milestone.manage"
    STATUS_MANAGE_PROJECT = "status.manage_project"
    GROUP_MANAGE_PROJECT = "group.manage_project"
    ROLE_GRANT_PROJECT = "role.grant_project"
    # finance
    FUNDING_MANAGE = "funding.manage"
    FUNDING_ATTACH = "funding.attach"
    TEMPLATE_MANAGE = "template.manage"
    EXPENSE_MANAGE = "expense.manage"
    BUDGET_EXPORT = "budget.export"
    # organization
    MEMBER_MANAGE = "member.manage"
    ROLE_MANAGE = "role.manage"
    GROUP_MANAGE = "group.manage"
    STATUS_MANAGE = "status.manage"
    ORG_SETTINGS = "org.settings"


class BuiltinRoleCode(StrEnum):
    VIEWER = "viewer"
    MEMBER = "member"
    PROJECT_MANAGER = "project_manager"
    PROJECT_DIRECTOR = "project_director"
    ORGANIZATION_DIRECTOR = "organization_director"
    ORGANIZATION_ADMIN = "organization_admin"
    FINANCIAL_CONTROLLER = "financial_controller"
