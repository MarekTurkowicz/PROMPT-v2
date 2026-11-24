from django.db import models
from django.db.models import Q

from app.activity.core.domain.enums.activity_action import ActivityAction
from app.activity.core.domain.enums.entity_type import EntityType

ENTITY_TYPES = [entity_type.value for entity_type in EntityType]
ACTIONS = [action.value for action in ActivityAction]


class ActivityLog(models.Model):
    """
    Represents one entry of the append-only event log: who did what to which object and when.
    """

    organization = models.ForeignKey(
        "app.Organization",
        on_delete=models.PROTECT,
        related_name="activity_logs",
        db_index=False,
    )
    actor = models.ForeignKey(
        "app.OrganizationMember",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="activity_logs",
    )

    entity_type = models.CharField(max_length=40, choices=[(value, value) for value in ENTITY_TYPES])
    entity_id = models.BigIntegerField()
    action = models.CharField(max_length=40, choices=[(value, value) for value in ACTIONS])
    changes = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "app"
        db_table = "activity_log"
        ordering = ["-created_at", "-id"]
        constraints = [
            models.CheckConstraint(
                condition=Q(entity_type__in=ENTITY_TYPES),
                name="activity_log_entity_type_valid",
            ),
            models.CheckConstraint(
                condition=Q(action__in=ACTIONS),
                name="activity_log_action_valid",
            ),
        ]
        indexes = [
            models.Index(
                fields=["entity_type", "entity_id", "created_at"],
                name="activity_log_entity_ix",
            ),
            models.Index(fields=["organization", "created_at"], name="activity_log_org_ix"),
        ]

    def __str__(self) -> str:
        return f"{self.actor or 'system'} {self.action} {self.entity_type} #{self.entity_id}"
