from decimal import Decimal

import pytest

from app.access.core.domain.value_objects.email import Email
from app.finance.core.domain.value_objects.due_days import DueDays
from app.project.core.domain.value_objects.color import Color
from app.shared.core.domain.exceptions import InvalidValueError
from app.shared.core.domain.value_objects.money import Currency, Money
from app.shared.core.domain.value_objects.position import Position
from app.task.core.domain.value_objects.comment_content import CommentContent
from app.task.core.domain.value_objects.estimated_hours import EstimatedHours
from app.task.core.domain.value_objects.file_size import FileSize
from app.task.core.domain.value_objects.hours import Hours
from app.task.core.domain.value_objects.priority import Priority


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
    ("factory", "value", "code"),
    [
        (Priority, 0, "task.invalid_priority"),
        (Position, -1, "shared.invalid_position"),
        (DueDays, -1, "finance.invalid_due_days"),
        (EstimatedHours, Decimal(0), "task.invalid_estimated_hours"),
        (Hours, Decimal("-1"), "task.invalid_hours"),
        (FileSize, 0, "task.invalid_file_size"),
        (Currency, "pln", "shared.invalid_currency"),
        (Color, "red", "project.invalid_color"),
        (CommentContent, "", "task.invalid_comment_content"),
    ],
)
def test_rejected_value_has_its_own_error_code(factory: type, value: object, code: str) -> None:
    with pytest.raises(InvalidValueError) as error:
        factory(value)
    assert error.value.code == code


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
    with pytest.raises(InvalidValueError) as error:
        Money(Decimal(0), Currency("PLN"))
    assert error.value.code == "shared.invalid_money_amount"
    assert Money(Decimal("10.50"), Currency("PLN")).amount == Decimal("10.50")


def test_email_is_lowercased() -> None:
    assert Email("Jan.Kowalski@Example.PL").value == "jan.kowalski@example.pl"
