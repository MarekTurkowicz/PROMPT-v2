from django.db import models
from django.db.models import Q


class Organization(models.Model):
    """
    Represents a customer organization (tenant) that owns all data except user accounts.
    """

    name = models.CharField(max_length=200)
    tax_id = models.CharField(max_length=20, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    settings = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "organization"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["tax_id"],
                condition=Q(tax_id__isnull=False),
                name="organization_tax_id_unique",
            ),
        ]

    def __str__(self) -> str:
        return self.name
