from datetime import datetime
from typing import Protocol

from app.activity.core.domain.entities.activity_log import ActivityLog
from app.activity.core.ports.api.queries.list_activity_query import ListActivityQuery


class ActivityLogPort(Protocol):
    def append(self, entry: ActivityLog) -> ActivityLog: ...
    def list(self, query: ListActivityQuery) -> list[ActivityLog]: ...
    def delete_older_than(self, organization_id: int, cutoff: datetime) -> int: ...
