import pytest
from rest_framework.test import APIClient

from app.access.adapter.outbound.relational_db.models.user import User
from app.activity.adapter.outbound.relational_db.repositories.activity_log_repository import (
    ActivityLogRepository,
)
from app.activity.core.domain.entities.activity_log import ActivityLog
from app.activity.core.domain.enums.activity_action import ActivityAction
from app.activity.core.domain.enums.entity_type import EntityType
from app.organization.adapter.outbound.relational_db.models.organization import Organization

pytestmark = pytest.mark.django_db


@pytest.fixture
def organization_id() -> int:
    organization_id = int(Organization.objects.create(name="Acme").pk)
    repository = ActivityLogRepository()
    for entity_type, action in [
        (EntityType.PROJECT, ActivityAction.CREATED),
        (EntityType.PROJECT, ActivityAction.UPDATED),
        (EntityType.PROJECT, ActivityAction.DELETED),
        (EntityType.TASK, ActivityAction.CREATED),
    ]:
        repository.append(ActivityLog(None, organization_id, None, entity_type, 1, action))
    return organization_id


@pytest.fixture
def client() -> APIClient:
    client = APIClient()
    client.force_login(User.objects.create_superuser(email="admin@example.com", password="secret"))
    return client


def url(organization_id: int) -> str:
    return f"/api/organization/{organization_id}/activity/"


def test_lists_the_organization_log_newest_first(client: APIClient, organization_id: int) -> None:
    response = client.get(url(organization_id))

    assert response.status_code == 200
    assert [(row["entity_type"], row["action"]) for row in response.json()] == [
        ("task", "created"),
        ("project", "deleted"),
        ("project", "updated"),
        ("project", "created"),
    ]


def test_filters_come_from_the_query_string(client: APIClient, organization_id: int) -> None:
    response = client.get(
        url(organization_id), {"entity_types": ["project"], "actions": ["created", "deleted"]}
    )

    assert response.status_code == 200
    assert {row["action"] for row in response.json()} == {"created", "deleted"}


@pytest.mark.parametrize(
    "params",
    [
        {"actions": ["teleported"]},
        {"entity_id": 1},
        {"entity_id": 1, "entity_types": ["project", "task"]},
        {"limit": 101},
        {"created_from": "2026-11-01T00:00:00Z", "created_to": "2026-10-01T00:00:00Z"},
    ],
)
def test_rejects_invalid_filters(
    client: APIClient, organization_id: int, params: dict[str, int | str | list[str]]
) -> None:
    assert client.get(url(organization_id), params).status_code == 400


def test_requires_login(organization_id: int) -> None:
    assert APIClient().get(url(organization_id)).status_code == 401
