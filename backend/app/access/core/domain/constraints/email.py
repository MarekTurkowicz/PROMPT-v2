from dataclasses import dataclass
from typing import ClassVar


@dataclass(frozen=True, slots=True)
class Email:
    LOWERCASE: ClassVar[bool] = True

    value: str

    def __post_init__(self) -> None:
        object.__setattr__(self, "value", self.value.lower())
