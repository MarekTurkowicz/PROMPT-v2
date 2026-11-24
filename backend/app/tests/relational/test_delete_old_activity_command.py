from datetime import UTC, datetime, timedelta

import pytest
from django.core.management import call_command

from app.activity.adapter.outbound.relational_db.models.activity_log import (
    ActivityLog as ActivityLogModel,
)
from app.activity.adapter.outbound.relational_db.repositories.activity_log_repository import (
    ActivityLogRepository,
)
from app.activity.core.domain.entities.activity_log import ActivityLog
from app.activity.core.domain.enums.activity_action import ActivityAction
from app.activity.core.domain.enums.entity_type import EntityType
from app.organization.adapter.outbound.relational_db.models.organization import Organization

pytestmark = pytest.mark.django_db


def add_entry(organization_id: int, age_in_days: int) -> int:
    saved = ActivityLogRepository().append(
        ActivityLog(None, organization_id, None, EntityType.PROJECT, 1, ActivityAction.CREATED)
    )
    assert saved.id is not None
    ActivityLogModel.objects.filter(pk=saved.id).update(
        created_at=datetime.now(UTC) - timedelta(days=age_in_days)
    )
    return saved.id


def test_deletes_expired_entries_in_every_organization(capsys: pytest.CaptureFixture[str]) -> None:
    first = int(Organization.objects.create(name="First").pk)
    second = int(Organization.objects.create(name="Second").pk)
    add_entry(first, age_in_days=200)
    add_entry(second, age_in_days=200)
    kept = [add_entry(first, age_in_days=150), add_entry(second, age_in_days=1)]

    call_command("delete_old_activity")

    assert sorted(ActivityLogModel.objects.values_list("pk", flat=True)) == sorted(kept)
    assert "Deleted 2 activity log entries" in capsys.readouterr().out
