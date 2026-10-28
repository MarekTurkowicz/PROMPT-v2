from django.db import models
from django.db.models import Q

from api.constants import CURRENCY_CODE


class ExpenseType(models.TextChoices):
    TRAVEL = "travel", "Travel"
    COURSES = "courses", "Courses"
    EXTERNAL_SERVICES = "external_services", "External Services"
    EQUIPMENT = "equipment", "Equipment"
    OTHER = "other", "Other"


class Expense(models.Model):
    """
    Represents a cost of a project, or a cost settled from a funding attached to a project
    (exactly one of the two); optionally tied to a task.
    """

    Type = ExpenseType

    project = models.ForeignKey(
        "api.Project",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="expenses",
        db_index=False,
    )
    project_funding = models.ForeignKey(
        "api.ProjectFunding",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="expenses",
    )
    task = models.ForeignKey(
        "api.Task",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="expenses",
    )

    type = models.CharField(max_length=40, choices=ExpenseType.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    currency = models.CharField(max_length=3, default="PLN")
    spent_on_date = models.DateField()
    document_number = models.CharField(max_length=100, null=True, blank=True)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "api.OrganizationMember",
        on_delete=models.PROTECT,
        related_name="expenses_created",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "expense"
        ordering = ["-spent_on_date", "-id"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(project__isnull=False, project_funding__isnull=True)
                    | Q(project__isnull=True, project_funding__isnull=False)
                ),
                name="expense_one_of_project_project_funding",
            ),
            models.CheckConstraint(
                condition=Q(type__in=ExpenseType.values), name="expense_type_valid"
            ),
            models.CheckConstraint(condition=Q(amount__gt=0), name="expense_amount_positive"),
            models.CheckConstraint(
                condition=Q(currency__regex=CURRENCY_CODE), name="expense_currency_code"
            ),
        ]
        indexes = [
            models.Index(fields=["project", "spent_on_date"], name="expense_project_ix"),
        ]

    def __str__(self) -> str:
        return f"{self.get_type_display()} {self.amount} {self.currency}"
