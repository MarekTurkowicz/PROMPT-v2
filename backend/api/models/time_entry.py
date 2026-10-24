from django.db import models
from django.db.models import F, Q


class TimeEntry(models.Model):
    """
    Represents hours logged within a task assignment, so only an assigned member can log time.
    """

    assignment = models.ForeignKey(
        "api.TaskAssignment",
        on_delete=models.PROTECT,
        related_name="time_entries",
        db_index=False,
    )

    hours = models.DecimalField(max_digits=5, decimal_places=2)
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField(null=True, blank=True)
    note = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "time_entry"
        ordering = ["-started_at"]
        constraints = [
            models.CheckConstraint(condition=Q(hours__gt=0), name="time_entry_hours_positive"),
            models.CheckConstraint(
                condition=Q(finished_at__isnull=True) | Q(finished_at__gt=F("started_at")),
                name="time_entry_dates_ok",
            ),
        ]
        indexes = [
            models.Index(fields=["assignment", "started_at"], name="time_entry_assignment_ix"),
        ]

    def __str__(self) -> str:
        return f"{self.assignment}: {self.hours} h"
