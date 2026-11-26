from app.shared.core.domain.exceptions import InvalidValueError


class InvalidCommentContentError(InvalidValueError):
    code = "task.invalid_comment_content"

    def __init__(self, value: object, msg: str) -> None:
        super().__init__("comment content", value, msg)


class InvalidEstimatedHoursError(InvalidValueError):
    code = "task.invalid_estimated_hours"

    def __init__(self, value: object, msg: str) -> None:
        super().__init__("estimated hours", value, msg)


class InvalidFileSizeError(InvalidValueError):
    code = "task.invalid_file_size"

    def __init__(self, value: object, msg: str) -> None:
        super().__init__("file size", value, msg)


class InvalidHoursError(InvalidValueError):
    code = "task.invalid_hours"

    def __init__(self, value: object, msg: str) -> None:
        super().__init__("hours", value, msg)


class InvalidPriorityError(InvalidValueError):
    code = "task.invalid_priority"

    def __init__(self, value: object, msg: str) -> None:
        super().__init__("priority", value, msg)
