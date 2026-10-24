from django.db import models
from django.db.models import F, Q

from api.models.constants import CURRENCY_CODE


class Funding(models.Model):
    class Type(models.TextChoices):
        GRANT = "grant", "Grant"
        SPONSORSHIP = "sponsorship", "Sponsoring"
        DONATION = "donation", "Darowizna"
        INTERNAL = "internal", "Wewnętrzne"

    organization = models.ForeignKey(
        "api.Organization",
        on_delete=models.PROTECT,
        related_name="fundings",
    )

    type = models.CharField(max_length=40, choices=Type.choices, default=Type.INTERNAL)
    name = models.CharField(max_length=200)
    funder = models.CharField(max_length=200, blank=True)
    program = models.CharField(max_length=200, blank=True)
    agreement_number = models.CharField(max_length=100, blank=True)
    amount_total = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default="PLN")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    reporting_deadline = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "funding"
        ordering = ["name", "id"]
        constraints = [
            models.CheckConstraint(condition=Q(amount_total__gt=0), name="funding_amount_positive"),
            models.CheckConstraint(
                condition=Q(currency__regex=CURRENCY_CODE), name="funding_currency_code"
            ),
            models.CheckConstraint(
                condition=(
                    Q(start_date__isnull=True)
                    | Q(end_date__isnull=True)
                    | Q(end_date__gte=F("start_date"))
                ),
                name="funding_dates_ok",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.get_type_display()})"
