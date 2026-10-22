from typing import Any

from django.contrib import admin
from django.db.models import QuerySet
from django.forms import BaseInlineFormSet, ModelForm
from django.http import HttpRequest

from .models import (
    Project,
    Funding,
    FundingTask,
    ProjectFunding,
    Task,
    TaskScope,
    TaskAssignment,
    UserProfile,
    Organization,
    Status,
    OrganizationMember,
    Permission,
    Role,
    RolePermission,
    Team,
    TeamMember,
    RoleAssignment,
    Milestone,
    Checklist,
    ChecklistItem,
    Notification,
    ActivityLog,
)


class TaskScopeInline(admin.StackedInline[TaskScope, Task]):

    model = TaskScope
    fk_name = "task"
    extra = 0
    can_delete = True
    autocomplete_fields = ["project", "funding", "project_funding"]


class FundingTaskInline(admin.TabularInline[FundingTask, Funding]):

    model = FundingTask
    extra = 0
    autocomplete_fields = ["funding"]


class ProjectFundingInline(admin.TabularInline[ProjectFunding, Project]):

    model = ProjectFunding
    extra = 0
    autocomplete_fields = ["funding"]


class ProjectTaskScopeInline(admin.TabularInline[TaskScope, Project]):

    model = TaskScope
    fk_name = "project"
    extra = 1
    verbose_name = "Project task"
    verbose_name_plural = "Project tasks"

    fields = ("task", "funding_scoped")
    autocomplete_fields = ["task"]

    exclude = ("funding", "project_funding")

    def get_queryset(self, request: HttpRequest) -> QuerySet[TaskScope]:
        qs = super().get_queryset(request)
        return qs.select_related("task").filter(project__isnull=False)

    def get_formset(
        self, request: HttpRequest, obj: Project | None = None, **kwargs: Any
    ) -> type[BaseInlineFormSet[TaskScope, Project, ModelForm[TaskScope]]]:
        FormSet = super().get_formset(request, obj, **kwargs)
        base_fields = FormSet.form.base_fields
        if "funding_scoped" in base_fields:
            base_fields["funding_scoped"].initial = False
            base_fields["funding_scoped"].disabled = True
        return FormSet


# ---------- Adminy głównych modeli ----------


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin[Task]):
    list_display = (
        "id",
        "title",
        "status",
        "priority",
        "project",
        "funding",
        "project_funding",
        "funding_scoped",
        "due_date",
        "created_at",
    )
    search_fields = (
        "title",
        "description",
        "scope__project__name",
        "scope__funding__name",
        "scope__project_funding__project__name",
        "scope__project_funding__funding__name",
    )
    list_select_related = (
        "scope",
        "scope__project",
        "scope__funding",
        "scope__project_funding",
        "template",
    )
    list_filter = (
        "status",
        "priority",
        ("scope__project", admin.RelatedOnlyFieldListFilter),
        ("scope__funding", admin.RelatedOnlyFieldListFilter),
        ("scope__project_funding", admin.RelatedOnlyFieldListFilter),
        "scope__funding_scoped",
    )
    ordering = ("-created_at",)
    inlines = [TaskScopeInline]

    @admin.display(description="Project", ordering="scope__project")
    def project(self, obj: Task) -> Project | None:
        scope: TaskScope | None = getattr(obj, "scope", None)
        return scope.project if scope else None

    @admin.display(description="Funding", ordering="scope__funding")
    def funding(self, obj: Task) -> Funding | None:
        scope: TaskScope | None = getattr(obj, "scope", None)
        return scope.funding if scope else None

    @admin.display(description="ProjectFunding", ordering="scope__project_funding")
    def project_funding(self, obj: Task) -> ProjectFunding | None:
        scope: TaskScope | None = getattr(obj, "scope", None)
        return scope.project_funding if scope else None

    @admin.display(boolean=True, description="Grant copy?", ordering="scope__funding_scoped")
    def funding_scoped(self, obj: Task) -> bool:
        scope: TaskScope | None = getattr(obj, "scope", None)
        return scope.funding_scoped if scope else False


@admin.register(TaskScope)
class TaskScopeAdmin(admin.ModelAdmin[TaskScope]):
    list_display = (
        "task",
        "project",
        "funding",
        "project_funding",
        "funding_scoped",
        "created_at",
    )
    search_fields = (
        "task__title",
        "project__name",
        "funding__name",
        "project_funding__project__name",
        "project_funding__funding__name",
    )
    autocomplete_fields = ["task", "project", "funding", "project_funding"]
    list_filter = (
        ("project", admin.RelatedOnlyFieldListFilter),
        ("funding", admin.RelatedOnlyFieldListFilter),
        ("project_funding", admin.RelatedOnlyFieldListFilter),
        "funding_scoped",
    )
    ordering = ("-created_at",)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin[Project]):
    list_display = (
        "id",
        "name",
        "status",
        "owner",
        "start_date",
        "end_date",
        "created_at",
    )
    search_fields = ("name", "description", "owner__username")
    list_filter = ("status", ("owner", admin.RelatedOnlyFieldListFilter))
    ordering = ("-created_at",)
    inlines = [ProjectFundingInline]
    autocomplete_fields = ["owner"]


@admin.register(Funding)
class FundingAdmin(admin.ModelAdmin[Funding]):
    list_display = (
        "id",
        "name",
        "program",
        "funder",
        "amount_total",
        "start_date",
        "end_date",
        "created_at",
    )
    search_fields = ("name", "program", "funder", "agreement_number", "description")
    list_filter = ("start_date", "end_date")
    ordering = ("-created_at",)
    inlines = [FundingTaskInline]


@admin.register(FundingTask)
class FundingTaskAdmin(admin.ModelAdmin[FundingTask]):
    list_display = (
        "id",
        "funding",
        "title",
        "default_status",
        "default_priority",
        "default_due_days",
    )
    search_fields = ("title", "funding__name")
    list_filter = (
        ("funding", admin.RelatedOnlyFieldListFilter),
        "default_status",
        "default_priority",
    )
    autocomplete_fields = ["funding"]
    ordering = ("funding", "id")


@admin.register(ProjectFunding)
class ProjectFundingAdmin(admin.ModelAdmin[ProjectFunding]):
    list_display = (
        "id",
        "project",
        "funding",
        "is_primary",
        "allocation_start",
        "allocation_end",
        "created_at",
    )
    search_fields = ("project__name", "funding__name", "note")
    list_filter = (
        ("project", admin.RelatedOnlyFieldListFilter),
        ("funding", admin.RelatedOnlyFieldListFilter),
        "is_primary",
        "allocation_start",
        "allocation_end",
    )
    autocomplete_fields = ["project", "funding"]
    ordering = ("-created_at",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin[UserProfile]):
    list_display = ("user", "phone")
    search_fields = ("user__username",)


@admin.register(TaskAssignment)
class TaskAssignmentAdmin(admin.ModelAdmin[TaskAssignment]):
    list_display = ("task", "user", "assigned_by", "assigned_at", "worked_hours")
    list_filter = ("assigned_by", "user")
    search_fields = (
        "task__title",
        "user__username",
        "user__first_name",
        "user__last_name",
    )


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin[Organization]):
    list_display = ("id", "name", "slug", "tax_id", "is_active", "created_at")
    search_fields = ("name", "slug", "tax_id")
    list_filter = ("is_active",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin[OrganizationMember]):
    list_display = ("organization", "user", "is_active", "invited_by", "joined_at")
    list_filter = ("is_active", ("organization", admin.RelatedOnlyFieldListFilter))
    search_fields = ("organization__name", "user__username")


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin[Permission]):
    list_display = ("code", "scope", "description")
    list_filter = ("scope",)
    search_fields = ("code", "description")


class RolePermissionInline(admin.TabularInline[RolePermission, Role]):

    model = RolePermission
    extra = 0


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin[Role]):
    list_display = ("code", "name", "scope", "organization")
    list_filter = ("scope", ("organization", admin.RelatedOnlyFieldListFilter))
    search_fields = ("code", "name")
    inlines = [RolePermissionInline]


class TeamMemberInline(admin.TabularInline[TeamMember, Team]):

    model = TeamMember
    fk_name = "team"
    extra = 0


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin[Team]):
    list_display = ("id", "name", "organization", "project", "parent", "created_at")
    search_fields = ("name",)
    inlines = [TeamMemberInline]


@admin.register(RoleAssignment)
class RoleAssignmentAdmin(admin.ModelAdmin[RoleAssignment]):
    list_display = ("role", "user", "team", "organization", "project", "granted_by", "created_at")
    list_filter = ("role",)
    search_fields = ("user__username", "team__name")


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin[Status]):
    list_display = ("code", "name", "applies_to", "category", "position", "organization", "is_default")
    list_filter = ("applies_to", "category")
    ordering = ("applies_to", "position")


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin[Milestone]):
    list_display = ("id", "name", "project", "status", "due_date")
    list_filter = ("status", ("project", admin.RelatedOnlyFieldListFilter))
    search_fields = ("name", "project__name")
    autocomplete_fields = ["project"]


class ChecklistItemInline(admin.TabularInline[ChecklistItem, Checklist]):

    model = ChecklistItem
    extra = 0


@admin.register(Checklist)
class ChecklistAdmin(admin.ModelAdmin[Checklist]):
    list_display = ("id", "title", "task", "position", "created_at")
    search_fields = ("title", "task__title")
    autocomplete_fields = ["task"]
    inlines = [ChecklistItemInline]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin[Notification]):
    list_display = ("recipient", "activity", "read_at")
    search_fields = ("recipient__username",)


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin[ActivityLog]):
    list_display = ("created_at", "actor", "action", "content_type", "object_id", "organization", "project")
    list_filter = ("action", ("project", admin.RelatedOnlyFieldListFilter))
    search_fields = ("actor__username",)
