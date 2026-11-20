import re
from dataclasses import dataclass
from typing import ClassVar

from app.shared.core.domain.exceptions import InvalidValueError


@dataclass(frozen=True, slots=True)
class Color:
    PATTERN: ClassVar[str] = "#[0-9A-Fa-f]{6}"

    value: str

    def __post_init__(self) -> None:
        if not re.fullmatch(self.PATTERN, self.value):
            raise InvalidValueError("color", self.value, "must be #RRGGBB")
