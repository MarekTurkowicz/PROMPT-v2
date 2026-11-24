from dataclasses import dataclass
from decimal import Decimal
from typing import ClassVar

from app.shared.core.domain.exceptions import InvalidValueError


@dataclass(frozen=True, slots=True)
class EstimatedHours:
    GREATER_THAN: ClassVar[int] = 0

    value: Decimal

    def __post_init__(self) -> None:
        if not self.value.is_finite() or self.value <= self.GREATER_THAN:
            raise InvalidValueError(
                "estimated hours", self.value, f"must be greater than {self.GREATER_THAN}"
            )
