from collections.abc import Hashable, Iterable, Sized
from enum import StrEnum

from app.domain.exceptions import (
    DuplicateError,
    FieldRequiredError,
    FieldTooLongError,
    InvalidChoiceError,
    TooManyItemsError,
)


def required_text(value: str, *, field: str, max_length: int) -> str:
    text = value.strip()
    if not text:
        raise FieldRequiredError(f"{field} must not be empty.", extra={"field": field})
    if len(text) > max_length:
        raise FieldTooLongError(
            f"{field} must have at most {max_length} characters.",
            extra={"field": field, "max_length": max_length},
        )
    return text


def optional_text(value: str | None, *, field: str, max_length: int) -> str | None:
    if value is None or not value.strip():
        return None
    return required_text(value, field=field, max_length=max_length)


def parse_choice[E: StrEnum](choice: type[E], value: str, *, field: str) -> E:
    try:
        return choice(value)
    except ValueError:
        allowed = ", ".join(member.value for member in choice)
        raise InvalidChoiceError(
            f"{value!r} is not a valid {field}; allowed: {allowed}.", extra={"field": field}
        ) from None


def ensure_unique[T: Hashable](values: Iterable[T], *, field: str) -> None:
    seen: set[T] = set()
    for value in values:
        if value in seen:
            raise DuplicateError(
                f"{field} {value!r} is already taken.", extra={"field": field, "value": value}
            )
        seen.add(value)


def ensure_at_most(items: Sized, limit: int, *, field: str) -> None:
    """Embedded arrays must be bounded: MongoDB documents are limited to 16 MB (PRD 2.1 §6.4)."""
    if len(items) > limit:
        raise TooManyItemsError(
            f"{field} can have at most {limit} items.", extra={"field": field, "limit": limit}
        )
