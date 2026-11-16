from typing import TypeIs

from app.shared.core.ports.api.unset import UNSET, Unset


def is_not_unset[T](value: T | Unset) -> TypeIs[T]:
    return value is not UNSET
