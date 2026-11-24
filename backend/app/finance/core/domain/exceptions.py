from app.shared.core.domain.exceptions import InvalidValueError


class InvalidDueDaysError(InvalidValueError):
    code = "finance.invalid_due_days"

    def __init__(self, value: object, msg: str) -> None:
        super().__init__("due days", value, msg)
