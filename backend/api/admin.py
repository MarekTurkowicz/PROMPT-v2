from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import Group

from .models import (
    ActivityLog,
    Attachment,
    ChecklistItem,
    Comment,
    Expense,
    Funding,
    MemberGroup,
    Milestone,
    Notification,
    Organization,
    OrganizationMember,
    Project,
    ProjectFunding,
    Role,
    RoleAssignment,
    Task,
    TaskAssignment,
    TaskStatus,
    TaskTemplate,
    TimeEntry,
    User,
)

# MemberGroupMember is not registered: Django 5.2 admin rejects models with a composite primary key.

# User has no Django groups (access comes from role_assignment)
admin.site.unregister(Group)


# ---------- Organizacja, ludzie, role ----------


@admin.register(User)
class UserAdmin(DjangoUserAdmin[User]):  # type: ignore[type-var]  # stubs require AbstractUser
    """Django's UserAdmin with the email as the login instead of username."""

    ordering = ("email",)
    list_display = ("email", "first_name", "last_name", "is_staff", "is_active")
    search_fields = ("email", "first_name", "last_name")
    # no Django groups / user permissions: access comes from role_assignment
    list_filter = ("is_staff", "is_superuser", "is_active")
    filter_horizontal = ()
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name")}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "usable_password", "password1", "password2"),
            },
        ),
    )


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin[Organization]):
    list_display = ("id", "name", "tax_id", "is_active", "created_at")
    search_fields = ("name", "tax_id")
    list_filter = ("is_active",)


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin[OrganizationMember]):
    list_display = ("user", "organization", "status", "job_title", "joined_at")
    list_select_related = ("user", "organization")
    list_filter = ("status", ("organization", admin.RelatedOnlyFieldListFilter))
    search_fields = ("user__email", "email", "organization__name")
    autocomplete_fields = ["organization", "user"]


@admin.register(MemberGroup)
class MemberGroupAdmin(admin.ModelAdmin[MemberGroup]):
    list_display = ("id", "name", "organization", "parent", "created_at")
    list_select_related = ("organization", "parent")
    list_filter = (("organization", admin.RelatedOnlyFieldListFilter),)
    search_fields = ("name",)
    autocomplete_fields = ["organization", "parent"]


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin[Role]):
    list_display = ("id", "name", "organization")
    list_select_related = ("organization",)
    list_filter = (("organization", admin.RelatedOnlyFieldListFilter),)
    search_fields = ("name",)


@admin.register(RoleAssignment)
class RoleAssignmentAdmin(admin.ModelAdmin[RoleAssignment]):
    list_display = ("role", "member", "group", "project", "created_at")
    list_select_related = ("role", "member__user", "member__organization", "group", "project")
    list_filter = (("role", admin.RelatedOnlyFieldListFilter),)
    search_fields = ("member__user__email", "group__name", "role__name")
    autocomplete_fields = ["role", "member", "group", "project"]


# ---------- Statusy, projekty, finansowanie ----------


@admin.register(TaskStatus)
class TaskStatusAdmin(admin.ModelAdmin[TaskStatus]):
    list_display = (
        "name",
        "category",
        "organization",
        "project",
        "position",
        "is_default",
        "is_active",
    )
    list_select_related = ("organization", "project")
    list_filter = ("category", "is_active", ("organization", admin.RelatedOnlyFieldListFilter))
    search_fields = ("name",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin[Project]):
    list_display = ("id", "name", "organization", "status", "owner", "start_date", "end_date")
    list_select_related = ("organization", "owner__user", "owner__organization")
    list_filter = ("status", ("organization", admin.RelatedOnlyFieldListFilter))
    search_fields = ("name", "description")
    autocomplete_fields = ["organization", "owner"]


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin[Milestone]):
    list_display = ("id", "name", "project", "status", "due_date", "position")
    list_select_related = ("project",)
    list_filter = ("status", ("project", admin.RelatedOnlyFieldListFilter))
    search_fields = ("name", "project__name")
    autocomplete_fields = ["project"]


@admin.register(Funding)
class FundingAdmin(admin.ModelAdmin[Funding]):
    list_display = ("id", "name", "type", "organization", "amount_total", "currency", "end_date")
    list_select_related = ("organization",)
    list_filter = ("type", ("organization", admin.RelatedOnlyFieldListFilter))
    search_fields = ("name", "funder", "program", "agreement_number")


@admin.register(ProjectFunding)
class ProjectFundingAdmin(admin.ModelAdmin[ProjectFunding]):
    list_display = ("id", "project", "funding", "is_primary", "allocation_start", "allocation_end")
    list_select_related = ("project", "funding")
    list_filter = ("is_primary",)
    search_fields = ("project__name", "funding__name")
    autocomplete_fields = ["project", "funding"]


@admin.register(TaskTemplate)
class TaskTemplateAdmin(admin.ModelAdmin[TaskTemplate]):
    list_display = ("id", "title", "funding", "default_priority", "default_due_days", "mandatory")
    list_select_related = ("funding",)
    list_filter = ("mandatory", ("funding", admin.RelatedOnlyFieldListFilter))
    search_fields = ("title", "funding__name")
    autocomplete_fields = ["funding"]


# ---------- Zadania ----------


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin[Task]):
    list_display = ("id", "title", "status", "priority", "project", "funding", "due_date")
    list_select_related = ("status", "project", "funding")
    list_filter = ("priority", ("project", admin.RelatedOnlyFieldListFilter))
    search_fields = ("title", "description")
    autocomplete_fields = [
        "project",
        "funding",
        "project_funding",
        "milestone",
        "parent",
        "template",
        "status",
        "group",
    ]


@admin.register(TaskAssignment)
class TaskAssignmentAdmin(admin.ModelAdmin[TaskAssignment]):
    list_display = ("task", "member", "assigned_by", "assigned_at", "started_at", "finished_at")
    list_select_related = (
        "task",
        "member__user",
        "member__organization",
        "assigned_by__user",
        "assigned_by__organization",
    )
    search_fields = ("task__title", "member__user__email")
    autocomplete_fields = ["task", "member", "assigned_by"]


@admin.register(TimeEntry)
class TimeEntryAdmin(admin.ModelAdmin[TimeEntry]):
    list_display = ("id", "assignment", "hours", "started_at", "finished_at")
    list_select_related = (
        "assignment__task",
        "assignment__member__user",
        "assignment__member__organization",
    )
    search_fields = ("assignment__task__title", "assignment__member__user__email")
    autocomplete_fields = ["assignment"]


@admin.register(ChecklistItem)
class ChecklistItemAdmin(admin.ModelAdmin[ChecklistItem]):
    list_display = ("id", "task", "checklist_title", "element", "order", "done_at")
    list_select_related = ("task",)
    search_fields = ("element", "checklist_title", "task__title")
    autocomplete_fields = ["task", "assignee", "done_by"]


# ---------- Współpraca, koszty, historia ----------


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin[Comment]):
    list_display = ("id", "author", "task", "project", "created_at")
    list_select_related = ("author__user", "author__organization", "task", "project")
    search_fields = ("content", "author__user__email")
    autocomplete_fields = ["task", "project", "author", "parent"]


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin[Attachment]):
    list_display = ("id", "original_name", "mime_type", "size_bytes", "uploaded_by", "created_at")
    list_select_related = ("uploaded_by__user", "uploaded_by__organization")
    search_fields = ("original_name",)
    autocomplete_fields = ["task", "comment", "expense", "uploaded_by"]


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin[Expense]):
    list_display = ("id", "type", "amount", "currency", "spent_on_date", "project", "created_by")
    list_select_related = ("project", "created_by__user", "created_by__organization")
    list_filter = ("type", ("project", admin.RelatedOnlyFieldListFilter))
    search_fields = ("document_number", "description", "project__name")
    autocomplete_fields = ["project", "project_funding", "task", "created_by"]


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin[ActivityLog]):
    list_display = ("created_at", "organization", "actor", "action", "entity_type", "entity_id")
    list_select_related = ("organization", "actor__user", "actor__organization")
    list_filter = ("action", "entity_type", ("organization", admin.RelatedOnlyFieldListFilter))
    search_fields = ("actor__user__email",)
    autocomplete_fields = ["organization", "actor"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin[Notification]):
    list_display = ("id", "recipient", "activity_log_entry", "read_at", "created_at")
    list_select_related = (
        "recipient",
        "activity_log_entry__actor__user",
        "activity_log_entry__actor__organization",
    )
    list_filter = ("read_at",)
    search_fields = ("recipient__email",)
    autocomplete_fields = ["activity_log_entry", "recipient"]
