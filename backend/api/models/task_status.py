from django.db import models
from django.db.models import Q


class StatusCategory(models.TextChoices):
    TODO = "todo", "To do"
    IN_PROGRESS = "in_progress", "In progress"
    DONE = "done", "Done"
    CANCELLED = "cancelled", "Cancelled"


class TaskStatus(models.Model):
    """
    Represents a task status of an organization, or of one project when ``project`` is set.
    """

    Category = StatusCategory

    organization = models.ForeignKey(
        "api.Organization",
        on_delete=models.CASCADE,
        related_name="task_statuses",
        db_index=False,
    )
    project = models.ForeignKey(
        "api.Project",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="task_statuses",
    )

    category = models.CharField(max_length=12, choices=StatusCategory.choices)
    name = models.CharField(max_length=60)
    color = models.CharField(max_length=7, default="#94a3b8")
    position = models.PositiveSmallIntegerField(default=0)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "task_status"
        ordering = ["position", "id"]
        constraints = [
            models.CheckConstraint(
                condition=Q(category__in=StatusCategory.values),
                name="task_status_category_valid",
            ),
            models.CheckConstraint(
                condition=Q(color__regex=r"^#[0-9A-Fa-f]{6}$"),
                name="task_status_color_hex",
            ),
            models.UniqueConstraint(
                fields=["organization", "project", "name"],
                nulls_distinct=False,
                name="task_status_name_unique",
            ),
            models.UniqueConstraint(
                fields=["organization"],
                condition=Q(is_default=True, project__isnull=True),
                name="task_status_one_default_in_org",
            ),
        ]

    def __str__(self) -> str:
        return self.name
