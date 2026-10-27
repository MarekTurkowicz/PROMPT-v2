from django.db import models
from django.db.models import Q


class Notification(models.Model):
    """
    Represents one recipient's notification: a copy of an activity log entry, or a system
    reminder when ``activity_log_entry`` is empty. ``content`` (PostgreSQL jsonb) holds title,
    body and link.
    """

    activity_log_entry = models.ForeignKey(
        "api.ActivityLog",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
        db_column="activity_id",
    )
    recipient = models.ForeignKey(
        "api.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    content = models.JSONField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notification"
        ordering = ["-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["activity_log_entry", "recipient"],
                name="notification_activity_recipient_unique",
            ),
        ]
        indexes = [
            models.Index(
                fields=["recipient"],
                condition=Q(read_at__isnull=True),
                name="notification_unread_ix",
            ),
        ]

    def __str__(self) -> str:
        title = (self.content or {}).get("title")
        return f"{self.recipient}: {title or self.activity_log_entry or 'reminder'}"

    @property
    def is_read(self) -> bool:
        return self.read_at is not None
