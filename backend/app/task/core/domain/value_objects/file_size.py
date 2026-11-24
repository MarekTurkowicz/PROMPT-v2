from dataclasses import dataclass
from typing import ClassVar

from app.shared.core.domain.exceptions import InvalidValueError


@dataclass(frozen=True, slots=True)
class FileSize:
    GREATER_THAN: ClassVar[int] = 0

    value: int

    def __post_init__(self) -> None:
        if self.value <= self.GREATER_THAN:
            raise InvalidValueError("file size", self.value, f"must be greater than {self.GREATER_THAN}")
