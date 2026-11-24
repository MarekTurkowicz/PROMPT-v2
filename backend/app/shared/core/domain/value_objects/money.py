import re
from dataclasses import dataclass
from decimal import Decimal
from typing import ClassVar

from app.shared.core.domain.exceptions import InvalidValueError


@dataclass(frozen=True, slots=True)
class Currency:
    PATTERN: ClassVar[str] = "[A-Z]{3}"

    value: str

    def __post_init__(self) -> None:
        if not re.fullmatch(self.PATTERN, self.value):
            raise InvalidValueError("currency", self.value, "must be a three-letter ISO 4217 code")


@dataclass(frozen=True, slots=True)
class Money:
    GREATER_THAN: ClassVar[int] = 0

    amount: Decimal
    currency: Currency

    def __post_init__(self) -> None:
        if not self.amount.is_finite() or self.amount <= self.GREATER_THAN:
            raise InvalidValueError("amount", self.amount, f"must be greater than {self.GREATER_THAN}")
