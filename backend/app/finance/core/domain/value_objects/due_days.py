from dataclasses import dataclass
from typing import ClassVar

from app.finance.core.domain.constants import DUE_DAYS_MIN
from app.finance.core.domain.exceptions import InvalidDueDaysError


@dataclass(frozen=True, slots=True)
class DueDays:
    MIN: ClassVar[int] = DUE_DAYS_MIN

    value: int

    def __post_init__(self) -> None:
        if self.value < self.MIN:
            raise InvalidDueDaysError(self.value, f"must be at least {self.MIN}")
