from datetime import datetime

import pytest

from app.access.core.application.authorizer import Authorizer
from app.access.core.domain.entities.organization_access import OrganizationAccess
from app.access.core.domain.enums.permission_enum import PermissionEnum
from app.access.core.domain.exceptions import AccessDeniedError
from app.activity.core.application.list_activity_use_case import ListActivityUseCase
from app.activity.core.domain.entities.activity_log import ActivityLog
from app.activity.core.domain.enums.activity_action import ActivityAction
from app.activity.core.domain.enums.entity_type import EntityType
from app.activity.core.ports.api.queries.list_activity_query import ListActivityQuery
from app.shared.core.ports.api.actor import Actor

LOG = ActivityLog(1, 10, None, EntityType.PROJECT, 5, ActivityAction.CREATED)


class FakeActivityLogRepository:
    def __init__(self) -> None:
        self.queries: list[ListActivityQuery] = []

    def append(self, entry: ActivityLog) -> ActivityLog:
        return entry

    def list(self, query: ListActivityQuery) -> list[ActivityLog]:
        self.queries.append(query)
        return [LOG]

    def delete_older_than(self, organization_id: int, cutoff: datetime) -> int:
        return 0


class FakeAccessRepository:
    def __init__(self, permissions: frozenset[PermissionEnum]) -> None:
        self.permissions = permissions

    def get_organization_access(self, user_id: int, organization_id: int) -> OrganizationAccess:
        return OrganizationAccess(is_active_member=True, permissions=self.permissions)


def use_case(
    permissions: frozenset[PermissionEnum],
) -> tuple[ListActivityUseCase, FakeActivityLogRepository]:
    repository = FakeActivityLogRepository()
    return ListActivityUseCase(repository, Authorizer(FakeAccessRepository(permissions))), repository


def test_member_with_the_permission_gets_the_log() -> None:
    list_activity, repository = use_case(frozenset({PermissionEnum.LIST_ACTIVITY}))
    query = ListActivityQuery(organization_id=10, actions=frozenset({ActivityAction.CREATED}))

    assert list_activity.execute(Actor(user_id=1, is_superuser=False), query) == [LOG]
    assert repository.queries == [query]


def test_member_without_the_permission_is_denied() -> None:
    list_activity, repository = use_case(frozenset())

    with pytest.raises(AccessDeniedError):
        list_activity.execute(Actor(user_id=1, is_superuser=False), ListActivityQuery(organization_id=10))
    assert repository.queries == []


def test_superuser_gets_the_log_without_a_role() -> None:
    list_activity, _ = use_case(frozenset())

    assert list_activity.execute(
        Actor(user_id=1, is_superuser=True), ListActivityQuery(organization_id=10)
    ) == [LOG]
