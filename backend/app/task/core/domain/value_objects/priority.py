from dataclasses import dataclass
from typing import ClassVar

from app.task.core.domain.constants import PRIORITY_MAX, PRIORITY_MIN
from app.task.core.domain.exceptions import InvalidPriorityError


@dataclass(frozen=True, slots=True)
class Priority:
    MIN: ClassVar[int] = PRIORITY_MIN
    MAX: ClassVar[int] = PRIORITY_MAX

    value: int

    def __post_init__(self) -> None:
        if not self.MIN <= self.value <= self.MAX:
            raise InvalidPriorityError(self.value, f"must be between {self.MIN} and {self.MAX}")
