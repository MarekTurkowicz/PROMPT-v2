from dataclasses import dataclass
from decimal import Decimal
from typing import ClassVar

from app.task.core.domain.exceptions import InvalidHoursError


@dataclass(frozen=True, slots=True)
class Hours:
    GREATER_THAN: ClassVar[int] = 0

    value: Decimal

    def __post_init__(self) -> None:
        if not self.value.is_finite() or self.value <= self.GREATER_THAN:
            raise InvalidHoursError(self.value, f"must be greater than {self.GREATER_THAN}")
