from dataclasses import dataclass
from typing import ClassVar

from app.task.core.domain.exceptions import InvalidCommentContentError


@dataclass(frozen=True, slots=True)
class CommentContent:
    MIN_LENGTH: ClassVar[int] = 1

    value: str

    def __post_init__(self) -> None:
        if len(self.value) < self.MIN_LENGTH:
            raise InvalidCommentContentError(self.value, "must not be empty")
