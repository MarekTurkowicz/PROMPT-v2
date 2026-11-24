import re
from dataclasses import dataclass
from typing import ClassVar

from app.project.core.domain.constants import COLOR_PATTERN
from app.project.core.domain.exceptions import InvalidColorError


@dataclass(frozen=True, slots=True)
class Color:
    PATTERN: ClassVar[str] = COLOR_PATTERN

    value: str

    def __post_init__(self) -> None:
        if not re.fullmatch(self.PATTERN, self.value):
            raise InvalidColorError(self.value, "must be #RRGGBB")
