from django.db import models
from django.db.models import Q


class MemberStatus(models.TextChoices):
    INVITED = "invited", "Invited"
    ACTIVE = "active", "Active"
    SUSPENDED = "suspended", "Suspended"
    LEFT = "left", "Left"


class OrganizationMember(models.Model):
    """
    Represents a user's membership in an organization, with organization-specific contact data.
    """

    Status = MemberStatus

    organization = models.ForeignKey(
        "api.Organization",
        on_delete=models.PROTECT,
        related_name="members",
        db_index=False,
    )
    user = models.ForeignKey(
        "api.User",
        on_delete=models.PROTECT,
        related_name="memberships",
    )

    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=32, null=True, blank=True)
    job_title = models.CharField(max_length=120, null=True, blank=True)
    avatar_url = models.URLField(max_length=500, null=True, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.INVITED)
    joined_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "organization_member"
        ordering = ["organization", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "user"], name="organization_member_unique"
            ),
            models.CheckConstraint(
                condition=Q(status__in=MemberStatus.values),
                name="organization_member_status_valid",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.user} @ {self.organization}"
