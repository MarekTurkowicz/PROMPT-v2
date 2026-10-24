from django.db import models
from django.db.models import F, Q


class ProjectFunding(models.Model):
    """
    Represents a funding used in a project (M:N with data).
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

    class Meta:
        db_table = "project_funding"
        constraints = [
            models.UniqueConstraint(fields=["project", "funding"], name="project_funding_unique"),
            models.UniqueConstraint(fields=["id", "project"], name="project_funding_id_project"),
            models.UniqueConstraint(
                fields=["project"],
                condition=Q(is_primary=True),
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
