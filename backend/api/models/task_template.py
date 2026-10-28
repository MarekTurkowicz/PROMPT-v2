from django.db import models
from django.db.models import Q

from api.constants import Priority


class TaskTemplate(models.Model):
    """
    Represents a task required by a funding; attaching the funding to a project creates
    one task per template.
    """

    funding = models.ForeignKey(
        "api.Funding",
        on_delete=models.CASCADE,
        related_name="task_templates",
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    default_status = models.ForeignKey(
        "api.TaskStatus",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="task_templates",
    )
    default_priority = models.SmallIntegerField(choices=Priority.choices, default=Priority.MEDIUM)
    default_est_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    default_due_days = models.IntegerField(null=True, blank=True)
    mandatory = models.BooleanField(default=False)

    class Meta:
        db_table = "task_template"
        ordering = ["funding", "id"]
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    default_priority__gte=Priority.LOWEST, default_priority__lte=Priority.HIGHEST
                ),
                name="task_template_priority_range",
            ),
            models.CheckConstraint(
                condition=Q(default_est_hours__isnull=True) | Q(default_est_hours__gt=0),
                name="task_template_est_hours_positive",
            ),
            models.CheckConstraint(
                condition=Q(default_due_days__isnull=True) | Q(default_due_days__gte=0),
                name="task_template_due_days_not_negative",
            ),
        ]

    def __str__(self) -> str:
        return f"[{self.funding.name}] {self.title}"
