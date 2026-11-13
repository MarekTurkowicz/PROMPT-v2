from enum import StrEnum


class ErrorKind(StrEnum):
    INVALID = "invalid"
    NOT_FOUND = "not_found"
    CONFLICT = "conflict"
    NOT_AUTHORIZED = "not_authorized"
    FORBIDDEN = "forbidden"
