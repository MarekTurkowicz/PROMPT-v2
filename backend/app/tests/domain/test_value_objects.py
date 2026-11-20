from decimal import Decimal

import pytest

from app.access.core.domain.constraints.email import Email
from app.finance.core.domain.constraints.due_days import DueDays
from app.project.core.domain.constraints.color import Color
from app.shared.core.domain.constraints.money import Currency, Money
from app.shared.core.domain.constraints.position import Position
from app.shared.core.domain.exceptions import InvalidValueError
from app.task.core.domain.constraints.comment_content import CommentContent
from app.task.core.domain.constraints.estimated_hours import EstimatedHours
from app.task.core.domain.constraints.file_size import FileSize
from app.task.core.domain.constraints.hours import Hours
from app.task.core.domain.constraints.priority import Priority


@pytest.mark.parametrize(
    ("factory", "value"),
    [
        (Priority, 0),
        (Priority, 6),
        (Position, -1),
        (DueDays, -1),
        (EstimatedHours, Decimal(0)),
        (EstimatedHours, Decimal("NaN")),
        (Hours, Decimal("-1")),
        (Hours, Decimal("Infinity")),
        (FileSize, 0),
        (Currency, "pln"),
        (Currency, "PLNX"),
        (Color, "#12345"),
        (Color, "red"),
        (CommentContent, ""),
    ],
)
def test_rejects_invalid_value(factory: type, value: object) -> None:
    with pytest.raises(InvalidValueError):
        factory(value)


@pytest.mark.parametrize(
    ("factory", "value"),
    [
        (Priority, 1),
        (Priority, 5),
        (Position, 0),
        (DueDays, 0),
        (EstimatedHours, Decimal("0.01")),
        (Hours, Decimal("8")),
        (FileSize, 1),
        (Currency, "PLN"),
        (Color, "#a1B2c3"),
        (CommentContent, "x"),
    ],
)
def test_accepts_valid_value(factory: type, value: object) -> None:
    assert factory(value).value == value


def test_money_needs_a_positive_amount() -> None:
    with pytest.raises(InvalidValueError):
        Money(Decimal(0), Currency("PLN"))
    assert Money(Decimal("10.50"), Currency("PLN")).amount == Decimal("10.50")


def test_email_is_lowercased() -> None:
    assert Email("Jan.Kowalski@Example.PL").value == "jan.kowalski@example.pl"
