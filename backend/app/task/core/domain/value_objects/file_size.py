from dataclasses import dataclass
from typing import ClassVar

from app.task.core.domain.exceptions import InvalidFileSizeError


@dataclass(frozen=True, slots=True)
class FileSize:
    GREATER_THAN: ClassVar[int] = 0

    value: int

    def __post_init__(self) -> None:
        if self.value <= self.GREATER_THAN:
            raise InvalidFileSizeError(self.value, f"must be greater than {self.GREATER_THAN}")
