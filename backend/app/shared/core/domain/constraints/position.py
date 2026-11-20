from dataclasses import dataclass
from typing import ClassVar

from app.shared.core.domain.exceptions import InvalidValueError


@dataclass(frozen=True, slots=True)
class Position:
    MIN: ClassVar[int] = 0

    value: int

    def __post_init__(self) -> None:
        if self.value < self.MIN:
            raise InvalidValueError("position", self.value, f"must be at least {self.MIN}")
