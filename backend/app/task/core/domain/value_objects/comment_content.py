from dataclasses import dataclass
from typing import ClassVar

from app.task.core.domain.constants import COMMENT_CONTENT_MIN_LENGTH
from app.task.core.domain.exceptions import InvalidCommentContentError


@dataclass(frozen=True, slots=True)
class CommentContent:
    MIN_LENGTH: ClassVar[int] = COMMENT_CONTENT_MIN_LENGTH

    value: str

    def __post_init__(self) -> None:
        if len(self.value) < self.MIN_LENGTH:
            raise InvalidCommentContentError(self.value, "must not be empty")
