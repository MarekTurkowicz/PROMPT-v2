import re
from dataclasses import dataclass
from decimal import Decimal
from typing import ClassVar

from app.shared.core.domain.constants import CURRENCY_PATTERN, MONEY_AMOUNT_GREATER_THAN
from app.shared.core.domain.exceptions import InvalidCurrencyError, InvalidMoneyAmountError


@dataclass(frozen=True, slots=True)
class Currency:
    PATTERN: ClassVar[str] = CURRENCY_PATTERN

    value: str

    def __post_init__(self) -> None:
        if not re.fullmatch(self.PATTERN, self.value):
            raise InvalidCurrencyError(self.value, "must be a three-letter ISO 4217 code")


@dataclass(frozen=True, slots=True)
class Money:
    GREATER_THAN: ClassVar[int] = MONEY_AMOUNT_GREATER_THAN

    amount: Decimal
    currency: Currency

    def __post_init__(self) -> None:
        if not self.amount.is_finite() or self.amount <= self.GREATER_THAN:
            raise InvalidMoneyAmountError(self.amount, f"must be greater than {self.GREATER_THAN}")
