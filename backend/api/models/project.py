from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import F, Q


class ProjectStatus(models.TextChoices):
    PLANNED = "planned", "Planned"
    ACTIVE = "active", "Active"
    CLOSED = "closed", "Closed"
    CANCELLED = "cancelled", "Cancelled"
    ARCHIVED = "archived", "Archived"


class Project(models.Model):
    """
    Represents a project of an organization.

    ``hidden_status_ids`` (PostgreSQL ``bigint[]``, no foreign key) lists organization
    statuses switched off in this project.
    """

    Status = ProjectStatus

    organization = models.ForeignKey(
        "api.Organization",
        on_delete=models.PROTECT,
        related_name="projects",
    )
    owner = models.ForeignKey(
        "api.OrganizationMember",
        on_delete=models.PROTECT,
        related_name="owned_projects",
    )

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=12, choices=ProjectStatus.choices, default=Status.PLANNED)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    hidden_status_ids = ArrayField(models.BigIntegerField(), default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "project"
        ordering = ["name", "id"]
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=ProjectStatus.values), name="project_status_valid"
            ),
            models.CheckConstraint(
                condition=(
                    Q(start_date__isnull=True)
                    | Q(end_date__isnull=True)
                    | Q(end_date__gte=F("start_date"))
                ),
                name="project_dates_ok",
            ),
        ]

    def __str__(self) -> str:
        return self.name
