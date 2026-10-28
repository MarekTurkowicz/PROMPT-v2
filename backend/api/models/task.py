from django.db import models
from django.db.models import F, Q

from api.constants import Priority


class Task(models.Model):
    """
    Represents a task of a project, or of a funding alone (exactly one of the two).

    ``project_funding`` must belong to the task's project; besides the ORM foreign key it is
    guarded by the composite foreign key (project_funding_id, project_id) added in a RunSQL
    migration.
    """

    Priority = Priority

    project = models.ForeignKey(
        "api.Project",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="tasks",
        db_index=False,
    )
    funding = models.ForeignKey(
        "api.Funding",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="tasks",
    )
    project_funding = models.ForeignKey(
        "api.ProjectFunding",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="tasks",
    )
    milestone = models.ForeignKey(
        "api.Milestone",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subtasks",
    )
    template = models.ForeignKey(
        "api.TaskTemplate",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    status = models.ForeignKey(
        "api.TaskStatus",
        on_delete=models.PROTECT,
        related_name="tasks",
    )
    group = models.ForeignKey(
        "api.MemberGroup",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.SmallIntegerField(choices=Priority.choices, default=Priority.MEDIUM)
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    est_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "task"
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(project__isnull=False, funding__isnull=True)
                    | Q(project__isnull=True, funding__isnull=False)
                ),
                name="task_one_of_project_funding",
            ),
            models.CheckConstraint(
                condition=Q(project_funding__isnull=True) | Q(project__isnull=False),
                name="task_project_funding_needs_project",
            ),
            models.CheckConstraint(
                condition=Q(priority__gte=Priority.LOWEST, priority__lte=Priority.HIGHEST),
                name="task_priority_range",
            ),
            models.CheckConstraint(
                condition=(
                    Q(start_date__isnull=True)
                    | Q(due_date__isnull=True)
                    | Q(due_date__gte=F("start_date"))
                ),
                name="task_dates_ok",
            ),
            models.CheckConstraint(
                condition=Q(est_hours__isnull=True) | Q(est_hours__gt=0),
                name="task_est_hours_positive",
            ),
            # attaching the same funding again must not copy its templates twice (P1)
            models.UniqueConstraint(
                fields=["project_funding", "template"],
                condition=Q(project_funding__isnull=False, template__isnull=False),
                name="task_template_once_per_project_funding",
            ),
        ]
        indexes = [
            models.Index(fields=["project", "status", "-priority"], name="task_project_status_ix"),
            models.Index(fields=["due_date"], name="task_due_ix"),
        ]

    def __str__(self) -> str:
        return self.title
