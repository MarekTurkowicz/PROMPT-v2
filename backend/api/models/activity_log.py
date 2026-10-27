from django.db import models
from django.db.models import Q


class EntityType(models.TextChoices):
    """
    Basic audit messages
    """

    ORGANIZATION = "organization", "Organization"
    ORGANIZATION_MEMBER = "organization_member", "Organization member"
    MEMBER_GROUP = "member_group", "Member group"
    ROLE = "role", "Role"
    ROLE_ASSIGNMENT = "role_assignment", "Role assignment"
    TASK_STATUS = "task_status", "Task status"
    PROJECT = "project", "Project"
    MILESTONE = "milestone", "Milestone"
    FUNDING = "funding", "Funding"
    PROJECT_FUNDING = "project_funding", "Project funding"
    TASK_TEMPLATE = "task_template", "Task template"
    TASK = "task", "Task"
    TASK_ASSIGNMENT = "task_assignment", "Task assignment"
    TIME_ENTRY = "time_entry", "Time entry"
    CHECKLIST_ITEM = "checklist_item", "Checklist item"
    COMMENT = "comment", "Comment"
    ATTACHMENT = "attachment", "Attachment"
    EXPENSE = "expense", "Expense"


class ActivityAction(models.TextChoices):
    CREATED = "created", "Created"
    UPDATED = "updated", "Updated"
    DELETED = "deleted", "Deleted"
    STATUS_CHANGED = "status_changed", "Status changed"
    ASSIGNED = "assigned", "Assigned"
    UNASSIGNED = "unassigned", "Unassigned"
    COMMENTED = "commented", "Commented"
    MEMBER_STATUS_CHANGED = "member_status_changed", "Member status changed"
    ROLE_GRANTED = "role_granted", "Role granted"
    ROLE_REVOKED = "role_revoked", "Role revoked"
    FUNDING_ATTACHED = "funding_attached", "Funding attached"


class ActivityLog(models.Model):
    """
    Represents one entry of the append-only event log: who did what to which object and when.
    """

    EntityType = EntityType
    Action = ActivityAction

    organization = models.ForeignKey(
        "api.Organization",
        on_delete=models.PROTECT,
        related_name="activity_logs",
        db_index=False,
    )
    actor = models.ForeignKey(
        "api.OrganizationMember",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="activity_logs",
    )

    entity_type = models.CharField(max_length=40, choices=EntityType.choices)
    entity_id = models.BigIntegerField()
    action = models.CharField(max_length=40, choices=ActivityAction.choices)
    changes = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "activity_log"
        ordering = ["-created_at", "-id"]
        constraints = [
            models.CheckConstraint(
                condition=Q(entity_type__in=EntityType.values),
                name="activity_log_entity_type_valid",
            ),
            models.CheckConstraint(
                condition=Q(action__in=ActivityAction.values),
                name="activity_log_action_valid",
            ),
        ]
        indexes = [
            models.Index(
                fields=["entity_type", "entity_id", "created_at"], name="activity_log_entity_ix"
            ),
            models.Index(fields=["organization", "created_at"], name="activity_log_org_ix"),
        ]

    def __str__(self) -> str:
        return f"{self.actor or 'system'} {self.action} {self.entity_type} #{self.entity_id}"
