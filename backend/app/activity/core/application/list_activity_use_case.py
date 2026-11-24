from app.access.core.application.authorizer import Authorizer
from app.access.core.application.requires_permission import requires_permission
from app.access.core.domain.enums.permission_enum import PermissionEnum
from app.activity.core.domain.entities.activity_log import ActivityLog
from app.activity.core.ports.api.list_activity_port import ListActivityPort
from app.activity.core.ports.api.queries.list_activity_query import ListActivityQuery
from app.activity.core.ports.spi.db.repositories.activity_log_port import ActivityLogPort
from app.shared.core.ports.api.actor import Actor


class ListActivityUseCase(ListActivityPort):
    def __init__(self, repository: ActivityLogPort, authorizer: Authorizer) -> None:
        self._repository = repository
        self._authorizer = authorizer

    @requires_permission(PermissionEnum.LIST_ACTIVITY)
    def execute(self, actor: Actor, query: ListActivityQuery) -> list[ActivityLog]:
        return self._repository.list(query)
