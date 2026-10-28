from django.db import models
from django.db.models import F, Q


class TaskAssignment(models.Model):
    """
    Represents a member working on a task: who assigned them and when the work started and ended.
    """

    task = models.ForeignKey(
        "api.Task",
        on_delete=models.CASCADE,
        related_name="assignments",
        db_index=False,
    )
    member = models.ForeignKey(
        "api.OrganizationMember",
        on_delete=models.PROTECT,
        related_name="task_assignments",
    )
    assigned_by = models.ForeignKey(
        "api.OrganizationMember",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="task_assignments_made",
    )

    assigned_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "task_assignment"
        ordering = ["-assigned_at"]
        constraints = [
            models.UniqueConstraint(fields=["task", "member"], name="task_assignment_unique"),
            models.CheckConstraint(
                condition=(
                    Q(started_at__isnull=True)
                    | Q(finished_at__isnull=True)
                    | Q(finished_at__gte=F("started_at"))
                ),
                name="task_assignment_dates_ok",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.member} -> {self.task}"
