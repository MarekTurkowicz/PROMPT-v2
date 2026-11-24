from dataclasses import dataclass
from typing import ClassVar

from app.shared.core.domain.constants import POSITION_MIN
from app.shared.core.domain.exceptions import InvalidPositionError


@dataclass(frozen=True, slots=True)
class Position:
    MIN: ClassVar[int] = POSITION_MIN

    value: int

    def __post_init__(self) -> None:
        if self.value < self.MIN:
            raise InvalidPositionError(self.value, f"must be at least {self.MIN}")
