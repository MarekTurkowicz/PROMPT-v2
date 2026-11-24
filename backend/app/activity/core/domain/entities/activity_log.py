import calendar
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import datetime
from types import MappingProxyType

from app.activity.core.domain.constants import ACTIVITY_RETENTION_MONTHS
from app.activity.core.domain.enums.activity_action import ActivityAction
from app.activity.core.domain.enums.entity_type import EntityType


@dataclass(frozen=True, slots=True)
class ActivityLog:
    id: int | None
    organization_id: int
    actor_id: int | None
    entity_type: EntityType
    entity_id: int
    action: ActivityAction
    changes: Mapping[str, tuple[object, object]] = field(default_factory=dict)
    created_at: datetime | None = None

    def __post_init__(self) -> None:
        object.__setattr__(self, "changes", MappingProxyType(dict(self.changes)))

    @staticmethod
    def deletable_before(now: datetime) -> datetime:
        return _months_before(now, ACTIVITY_RETENTION_MONTHS)


def _months_before(moment: datetime, months: int) -> datetime:
    year, month_index = divmod(moment.year * 12 + moment.month - 1 - months, 12)
    month = month_index + 1
    day = min(moment.day, calendar.monthrange(year, month)[1])
    return moment.replace(year=year, month=month, day=day)
