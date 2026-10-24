from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex
from django.db import models


class Role(models.Model):
    """
    Represents a named set of permission codes (PostgreSQL ``varchar[]``) of one organization.
    """

    organization = models.ForeignKey(
        "api.Organization",
        on_delete=models.CASCADE,
        related_name="roles",
        db_index=False,
    )

    name = models.CharField(max_length=120)
    permissions = ArrayField(models.CharField(max_length=60), default=list, blank=True)

    class Meta:
        db_table = "role"
        ordering = ["name", "id"]
        constraints = [
            models.UniqueConstraint(fields=["organization", "name"], name="role_name_unique"),
        ]
        indexes = [
            GinIndex(fields=["permissions"], name="role_permissions_gin"),
        ]

    def __str__(self) -> str:
        return self.name
