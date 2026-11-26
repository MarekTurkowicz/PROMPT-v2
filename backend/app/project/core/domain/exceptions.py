from app.shared.core.domain.exceptions import InvalidValueError


class InvalidColorError(InvalidValueError):
    code = "project.invalid_color"

    def __init__(self, value: object, msg: str) -> None:
        super().__init__("color", value, msg)
