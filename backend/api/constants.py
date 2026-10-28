from django.db import models

CURRENCY_CODE = r"^[A-Z]{3}$"
MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024


class Priority(models.IntegerChoices):
    """Five priority levels; organizations may rename them in ``Organization.settings``."""

    LOWEST = 1, "Lowest"
    LOW = 2, "Low"
    MEDIUM = 3, "Medium"
    HIGH = 4, "High"
    HIGHEST = 5, "Highest"
