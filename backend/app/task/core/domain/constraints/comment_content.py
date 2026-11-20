from dataclasses import dataclass
from typing import ClassVar

from app.shared.core.domain.exceptions import InvalidValueError


@dataclass(frozen=True, slots=True)
class CommentContent:
    MIN_LENGTH: ClassVar[int] = 1

    value: str

    def __post_init__(self) -> None:
        if len(self.value) < self.MIN_LENGTH:
            raise InvalidValueError("comment content", self.value, "must not be empty")
