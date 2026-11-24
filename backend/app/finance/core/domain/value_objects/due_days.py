from dataclasses import dataclass
from typing import ClassVar

from app.finance.core.domain.exceptions import InvalidDueDaysError


@dataclass(frozen=True, slots=True)
class DueDays:
    MIN: ClassVar[int] = 0

    value: int

    def __post_init__(self) -> None:
        if self.value < self.MIN:
            raise InvalidDueDaysError(self.value, f"must be at least {self.MIN}")
