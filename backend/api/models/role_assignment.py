from django.db import models
from django.db.models import Q


class RoleAssignment(models.Model):
    """
    Represents the single place where access is granted: a role given to a member or a group,
    in the whole organization (``project`` empty) or in one project.
    """

    role = models.ForeignKey(
        "api.Role",
        on_delete=models.CASCADE,
        related_name="assignments",
        db_index=False,
    )
    member = models.ForeignKey(
        "api.OrganizationMember",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="role_assignments",
    )
    group = models.ForeignKey(
        "api.MemberGroup",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="role_assignments",
    )
    project = models.ForeignKey(
        "api.Project",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="role_assignments",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "role_assignment"
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(member__isnull=False, group__isnull=True)
                    | Q(member__isnull=True, group__isnull=False)
                ),
                name="role_assignment_member_xor_group",
            ),
            models.UniqueConstraint(
                fields=["role", "member", "group", "project"],
                nulls_distinct=False,
                name="role_assignment_unique",
            ),
        ]

    def __str__(self) -> str:
        who = self.member or self.group
        where = self.project or "organization"
        return f"{who}: {self.role} @ {where}"
