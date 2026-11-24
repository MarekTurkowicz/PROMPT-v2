from typing import Protocol

from app.activity.core.domain.entities.activity_log import ActivityLog
from app.activity.core.ports.api.queries.list_activity_query import ListActivityQuery
from app.shared.core.ports.api.actor import Actor


class ListActivityPort(Protocol):
    def execute(self, actor: Actor, query: ListActivityQuery) -> list[ActivityLog]: ...
