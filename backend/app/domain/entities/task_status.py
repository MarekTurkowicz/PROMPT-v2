import re
from dataclasses import dataclass

from app.domain.enums import StatusCategory
from app.domain.exceptions import ValidationError
from app.domain.validation import parse_choice, required_text

STATUS_NAME_MAX_LENGTH = 60
STATUS_POSITION_MAX = 32767  # PostgreSQL PositiveSmallIntegerField
DEFAULT_STATUS_COLOR = "#94a3b8"
_COLOR = re.compile(r"^#[0-9A-Fa-f]{6}$")


@dataclass(frozen=True)
class TaskStatus:
    """Rules across statuses (unique name, one default, fixed category) live in the aggregate."""

    id: int | None
    category: StatusCategory
    name: str
    color: str = DEFAULT_STATUS_COLOR
    position: int = 0
    is_default: bool = False
    is_active: bool = True

    def __post_init__(self) -> None:
        category = parse_choice(StatusCategory, self.category, field="status.category")
        name = required_text(self.name, field="status.name", max_length=STATUS_NAME_MAX_LENGTH)
        object.__setattr__(self, "category", category)
        object.__setattr__(self, "name", name)
        if not _COLOR.match(self.color):
            raise ValidationError(
                "status.color must be in the #RRGGBB format.",
                extra={"field": "status.color", "value": self.color},
            )
        if not 0 <= self.position <= STATUS_POSITION_MAX:
            raise ValidationError(
                f"status.position must be between 0 and {STATUS_POSITION_MAX}.",
                extra={"field": "status.position", "value": self.position},
            )
