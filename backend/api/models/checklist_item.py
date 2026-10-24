from django.db import models
from django.db.models import Q


class ChecklistItem(models.Model):
    """
    Represents one point of a checklist in a task; points sharing ``checklist_title``
    form one checklist.
    """

    task = models.ForeignKey(
        "api.Task",
        on_delete=models.CASCADE,
        related_name="checklist_items",
        db_index=False,
    )

    checklist_title = models.CharField(max_length=120, null=True, blank=True)
    element = models.CharField(max_length=300)
    order = models.PositiveSmallIntegerField(default=0)
    assignee = models.ForeignKey(
        "api.OrganizationMember",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checklist_items",
    )
    done_by = models.ForeignKey(
        "api.OrganizationMember",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="checklist_items_done",
    )
    done_at = models.DateTimeField(null=True, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "checklist_item"
        ordering = ["checklist_title", "order", "id"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(done_by__isnull=True, done_at__isnull=True)
                    | Q(done_by__isnull=False, done_at__isnull=False)
                ),
                name="checklist_item_done_both_or_none",
            ),
        ]
        indexes = [
            models.Index(
                fields=["task", "checklist_title", "order"], name="checklist_item_task_ix"
            ),
        ]

    def __str__(self) -> str:
        return f"{'[x]' if self.is_done else '[ ]'} {self.element}"

    @property
    def is_done(self) -> bool:
        return self.done_at is not None
