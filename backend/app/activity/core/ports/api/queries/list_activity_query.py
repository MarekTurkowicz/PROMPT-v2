from dataclasses import dataclass
from datetime import datetime

from app.activity.core.domain.enums.activity_action import ActivityAction
from app.activity.core.domain.enums.entity_type import EntityType


@dataclass(frozen=True, slots=True)
class ListActivityQuery:
    organization_id: int
    actor_id: int | None = None
    entity_types: frozenset[EntityType] = frozenset()
    actions: frozenset[ActivityAction] = frozenset()
    entity_id: int | None = None
    created_from: datetime | None = None
    created_to: datetime | None = None
    limit: int = 50
    offset: int = 0
