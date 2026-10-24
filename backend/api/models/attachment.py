from django.db import models
from django.db.models import Q

from api.models.constants import MAX_ATTACHMENT_SIZE


class Attachment(models.Model):
    """
    Represents a file attached to a task, a comment or an expense (exactly one of the three).
    """

    task = models.ForeignKey(
        "api.Task",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="attachments",
    )
    comment = models.ForeignKey(
        "api.Comment",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="attachments",
    )
    expense = models.ForeignKey(
        "api.Expense",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="attachments",
    )
    uploaded_by = models.ForeignKey(
        "api.OrganizationMember",
        on_delete=models.PROTECT,
        related_name="attachments_uploaded",
    )

    file = models.FileField(upload_to="attachments/", max_length=500)
    original_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=100)
    size_bytes = models.BigIntegerField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "attachment"
        ordering = ["created_at", "id"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(task__isnull=False, comment__isnull=True, expense__isnull=True)
                    | Q(task__isnull=True, comment__isnull=False, expense__isnull=True)
                    | Q(task__isnull=True, comment__isnull=True, expense__isnull=False)
                ),
                name="attachment_exactly_one_owner",
            ),
            models.CheckConstraint(
                condition=Q(size_bytes__gt=0, size_bytes__lte=MAX_ATTACHMENT_SIZE),
                name="attachment_size_in_range",
            ),
        ]

    def __str__(self) -> str:
        return self.original_name
