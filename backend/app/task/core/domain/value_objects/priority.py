from dataclasses import dataclass
from typing import ClassVar

from app.task.core.domain.exceptions import InvalidPriorityError


@dataclass(frozen=True, slots=True)
class Priority:
    MIN: ClassVar[int] = 1
    MAX: ClassVar[int] = 5

    value: int

    def __post_init__(self) -> None:
        if not self.MIN <= self.value <= self.MAX:
            raise InvalidPriorityError(self.value, f"must be between {self.MIN} and {self.MAX}")
