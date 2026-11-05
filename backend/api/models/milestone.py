from django.db import models
from django.db.models import Q


class MilestoneStatus(models.TextChoices):
    PLANNED = "planned", "Planned"
    ACTIVE = "active", "Active"
    DONE = "done", "Done"


class Milestone(models.Model):
    """
    Represents a stage of a project that groups tasks and has its own deadline.
    """

    Status = MilestoneStatus

    project = models.ForeignKey(
        "api.Project",
        on_delete=models.CASCADE,
        related_name="milestones",
        db_index=False,
    )

    name = models.CharField(max_length=200)
    status = models.CharField(
        max_length=12, choices=MilestoneStatus.choices, default=Status.PLANNED
    )
    due_date = models.DateField(null=True, blank=True)
    position = models.PositiveSmallIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "milestone"
        ordering = ["position", "id"]
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=MilestoneStatus.values), name="milestone_status_valid"
            ),
        ]
        indexes = [
            models.Index(fields=["project", "position"], name="milestone_project_ix"),
        ]

    def __str__(self) -> str:
        return f"[{self.project.name}] {self.name}"
