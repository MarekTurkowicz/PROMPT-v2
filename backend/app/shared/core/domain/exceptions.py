from typing import ClassVar

from app.shared.core.domain.error_kind import ErrorKind


class ApplicationError(Exception):
    kind: ClassVar[ErrorKind]
    code: ClassVar[str]

    # TODO Do weryfikacji
    def __init__(self, message: str, **params: object) -> None:
        self.message = message
        self.params = params
        super().__init__(message)

    def __init_subclass__(cls, **kwargs: object) -> None:
        super().__init_subclass__(**kwargs)
        if cls.__dict__.get("abstract"):
            return
        for name in ("kind", "code"):
            if not hasattr(cls, name):
                raise TypeError(f"{cls.__name__} must define {name}")


class DomainError(ApplicationError):
    abstract = True


class InvalidValueError(DomainError):
    kind = ErrorKind.INVALID
    code = "shared.invalid_value"

    def __init__(self, field: str, value: object, msg: str) -> None:
        super().__init__(f"Invalid {field}: {value!r}\nReason: {msg}", field=field, value=value, msg=msg)
