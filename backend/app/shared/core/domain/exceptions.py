from typing import ClassVar

from app.shared.core.domain.error_kind import ErrorKind


class ApplicationError(Exception):
    kind: ClassVar[ErrorKind]
    code: ClassVar[str]

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


class DomainException(ApplicationError):
    abstract = True
