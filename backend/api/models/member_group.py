from django.db import models


class MemberGroup(models.Model):
    """
    Represents a group of organization members; a subgroup inherits the roles of its parents.
    """

    organization = models.ForeignKey(
        "api.Organization",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="groups",
        db_index=False,
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subgroups",
    )

    name = models.CharField(max_length=120)
    description = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "member_group"
        ordering = ["name", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "name"], name="member_group_name_unique"
            ),
        ]

    def __str__(self) -> str:
        return self.name
