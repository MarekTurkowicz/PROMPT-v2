from django.db import models
from django.db.models import F, Q


class ProjectFunding(models.Model):
    """
    Represents a funding used in a project (M:N with data).

    Detaching a funding sets ``detached_at`` instead of deleting the row: tasks with work done
    and expenses keep pointing at it, so it stays known which funding (and period) they belong
    to. Uniqueness and the primary flag apply to active rows only, so the same funding can be
    attached again later as a new row.
    """

    project = models.ForeignKey(
        "api.Project",
        on_delete=models.PROTECT,
        related_name="project_fundings",
        db_index=False,
    )
    funding = models.ForeignKey(
        "api.Funding",
        on_delete=models.PROTECT,
        related_name="project_fundings",
    )

    allocation_start = models.DateField(null=True, blank=True)
    allocation_end = models.DateField(null=True, blank=True)
    is_primary = models.BooleanField(default=False)
    note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    detached_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "project_funding"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "funding"],
                condition=Q(detached_at__isnull=True),
                name="project_funding_unique",
            ),
            models.UniqueConstraint(fields=["id", "project"], name="project_funding_id_project"),
            models.UniqueConstraint(
                fields=["project"],
                condition=Q(is_primary=True, detached_at__isnull=True),
                name="project_funding_one_primary",
            ),
            models.CheckConstraint(
                condition=(
                    Q(allocation_start__isnull=True)
                    | Q(allocation_end__isnull=True)
                    | Q(allocation_end__gte=F("allocation_start"))
                ),
                name="project_funding_dates_ok",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.project} ↔ {self.funding}"

    @property
    def is_detached(self) -> bool:
        return self.detached_at is not None
