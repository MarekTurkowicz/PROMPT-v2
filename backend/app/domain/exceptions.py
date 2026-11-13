from collections import Counter
from typing import Any


class DomainError(Exception):
    err_code: str = "ERR_0000"
    detail: str = "domain error"

    def __init__(self, detail: str | None = None, extra: dict[str, Any] | None = None) -> None:
        self.extra: dict[str, Any] = extra or {}
        if detail is not None:
            self.detail = detail
        self.err_code = _get_error_code(self.__class__)
        super().__init__(self.detail)

    def to_dict(self) -> dict[str, Any]:
        return {"detail": self.detail, "extra": self.extra, "err_code": self.err_code}


class NotFoundError(DomainError):
    detail = "not found"


class ValidationError(DomainError):
    detail = "validation error"


class ConflictError(DomainError):
    detail = "conflict"


class AuthenticationError(DomainError):
    detail = "authentication required"


class PermissionDeniedError(DomainError):
    detail = "permission denied"


class FieldRequiredError(ValidationError):
    detail = "field must not be empty"


class FieldTooLongError(ValidationError):
    detail = "field is too long"


class FieldImmutableError(ValidationError):
    detail = "field cannot change"


class InvalidChoiceError(ValidationError):
    detail = "value is not an allowed choice"


class TooManyItemsError(ValidationError):
    detail = "too many items"


class OrganizationSettingsInvalidError(ValidationError):
    detail = "invalid organization settings"


class MultipleDefaultStatusesError(ValidationError):
    detail = "an organization can have at most one default status"


class BuiltinRoleNotDeletableError(ValidationError):
    detail = "built-in role cannot be deleted"


class MemberStatusTransitionInvalidError(ValidationError):
    detail = "member status transition is not allowed"


class DuplicateError(ValidationError):
    detail = "value is already taken"


_ERROR_CODES: dict[type[DomainError], str] = {
    DomainError: "ERR_0000",
    NotFoundError: "ERR_0001",
    ValidationError: "ERR_0002",
    ConflictError: "ERR_0003",
    FieldRequiredError: "ERR_0004",
    FieldTooLongError: "ERR_0005",
    InvalidChoiceError: "ERR_0006",
    TooManyItemsError: "ERR_0007",
    OrganizationSettingsInvalidError: "ERR_0008",
    FieldImmutableError: "ERR_0009",
    MultipleDefaultStatusesError: "ERR_0010",
    BuiltinRoleNotDeletableError: "ERR_0011",
    MemberStatusTransitionInvalidError: "ERR_0012",
    DuplicateError: "ERR_0013",
    AuthenticationError: "ERR_0014",
    PermissionDeniedError: "ERR_0015",
}


def _get_error_code(cls: type[DomainError]) -> str:
    return _ERROR_CODES.get(cls, "ERR_0000")


def check_error_codes() -> None:
    duplicates = sorted(code for code, n in Counter(_ERROR_CODES.values()).items() if n > 1)
    if duplicates:
        raise RuntimeError(f"duplicate error codes: {', '.join(duplicates)}")

    subclasses = list(DomainError.__subclasses__())
    while subclasses:
        subclass = subclasses.pop()
        subclasses.extend(subclass.__subclasses__())
        if subclass not in _ERROR_CODES:
            raise RuntimeError(f"exception {subclass.__name__} doesn't have error code assigned")
