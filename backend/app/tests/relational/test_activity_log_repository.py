from datetime import timedelta

import pytest
from django.utils import timezone

from app.activity.adapter.outbound.relational_db.models.activity_log import (
    ActivityLog as ActivityLogModel,
)
from app.activity.adapter.outbound.relational_db.repositories.activity_log_repository import (
    ActivityLogRepository,
)
from app.activity.core.domain.entities.activity_log import ActivityLog
from app.activity.core.domain.enums.activity_action import ActivityAction
from app.activity.core.domain.enums.entity_type import EntityType
from app.activity.core.ports.api.queries.list_activity_query import ListActivityQuery
from app.organization.adapter.outbound.relational_db.models.organization import Organization

pytestmark = pytest.mark.django_db


@pytest.fixture
def organization_id() -> int:
    return int(Organization.objects.create(name="Acme").pk)


@pytest.fixture
def repository() -> ActivityLogRepository:
    return ActivityLogRepository()


def entry(
    organization_id: int,
    entity_type: EntityType = EntityType.PROJECT,
    action: ActivityAction = ActivityAction.CREATED,
    entity_id: int = 1,
    changes: dict[str, tuple[object, object]] | None = None,
) -> ActivityLog:
    return ActivityLog(
        id=None,
        organization_id=organization_id,
        actor_id=None,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        changes=changes or {},
    )


def test_append_returns_the_saved_entry(repository: ActivityLogRepository, organization_id: int) -> None:
    saved = repository.append(entry(organization_id, changes={"name": ("Old", "New")}))

    assert saved.id is not None
    assert saved.created_at is not None
    assert ActivityLogModel.objects.get(pk=saved.id).changes == {"name": ["Old", "New"]}


def test_list_returns_the_changes_as_pairs(repository: ActivityLogRepository, organization_id: int) -> None:
    repository.append(entry(organization_id, action=ActivityAction.UPDATED, changes={"name": ("Old", "New")}))

    [listed] = repository.list(ListActivityQuery(organization_id))

    assert listed.changes == {"name": ("Old", "New")}


def test_list_is_newest_first(repository: ActivityLogRepository, organization_id: int) -> None:
    first = repository.append(entry(organization_id, entity_id=1))
    second = repository.append(entry(organization_id, entity_id=2))

    assert [log.id for log in repository.list(ListActivityQuery(organization_id))] == [second.id, first.id]


def test_list_filters_by_entity_types_and_actions(
    repository: ActivityLogRepository, organization_id: int
) -> None:
    repository.append(entry(organization_id, EntityType.PROJECT, ActivityAction.CREATED))
    repository.append(entry(organization_id, EntityType.PROJECT, ActivityAction.UPDATED))
    repository.append(entry(organization_id, EntityType.PROJECT, ActivityAction.DELETED))
    repository.append(entry(organization_id, EntityType.TASK, ActivityAction.CREATED))

    listed = repository.list(
        ListActivityQuery(
            organization_id,
            entity_types=frozenset({EntityType.PROJECT}),
            actions=frozenset({ActivityAction.CREATED, ActivityAction.DELETED}),
        )
    )

    assert {(log.entity_type, log.action) for log in listed} == {
        (EntityType.PROJECT, ActivityAction.CREATED),
        (EntityType.PROJECT, ActivityAction.DELETED),
    }


def test_list_shows_only_the_given_organization(
    repository: ActivityLogRepository, organization_id: int
) -> None:
    other_organization_id = int(Organization.objects.create(name="Other").pk)
    repository.append(entry(organization_id))
    repository.append(entry(other_organization_id))

    listed = repository.list(ListActivityQuery(organization_id))

    assert [log.organization_id for log in listed] == [organization_id]


def test_list_pages_with_limit_and_offset(repository: ActivityLogRepository, organization_id: int) -> None:
    saved = [repository.append(entry(organization_id, entity_id=number)) for number in range(3)]

    page = repository.list(ListActivityQuery(organization_id, limit=1, offset=1))

    assert [log.id for log in page] == [saved[1].id]


def test_delete_older_than_keeps_newer_entries(
    repository: ActivityLogRepository, organization_id: int
) -> None:
    old = repository.append(entry(organization_id, entity_id=1))
    new = repository.append(entry(organization_id, entity_id=2))
    assert old.id is not None
    ActivityLogModel.objects.filter(pk=old.id).update(created_at=timezone.now() - timedelta(days=200))

    deleted = repository.delete_older_than(organization_id, timezone.now() - timedelta(days=183))

    assert deleted == 1
    assert [log.id for log in repository.list(ListActivityQuery(organization_id))] == [new.id]
