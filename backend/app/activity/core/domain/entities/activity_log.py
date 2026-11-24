from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import datetime
from types import MappingProxyType

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
