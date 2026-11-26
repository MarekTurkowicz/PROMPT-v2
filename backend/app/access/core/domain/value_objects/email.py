from dataclasses import dataclass
from typing import ClassVar

from app.access.core.domain.constants import EMAIL_LOWERCASE


@dataclass(frozen=True, slots=True)
class Email:
    LOWERCASE: ClassVar[bool] = EMAIL_LOWERCASE

    value: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "value", self.value.lower())
