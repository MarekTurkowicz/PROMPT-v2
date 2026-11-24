from datetime import UTC, datetime

import pytest

from app.activity.core.domain.entities.activity_log import ActivityLog


@pytest.mark.parametrize(
    ("now", "cutoff"),
    [
        (datetime(2026, 11, 24, 10, tzinfo=UTC), datetime(2026, 5, 24, 10, tzinfo=UTC)),
        (datetime(2026, 8, 31, 10, tzinfo=UTC), datetime(2026, 2, 28, 10, tzinfo=UTC)),
        (datetime(2026, 3, 31, 10, tzinfo=UTC), datetime(2025, 9, 30, 10, tzinfo=UTC)),
        (datetime(2028, 8, 31, 10, tzinfo=UTC), datetime(2028, 2, 29, 10, tzinfo=UTC)),
        (datetime(2026, 1, 15, 10, tzinfo=UTC), datetime(2025, 7, 15, 10, tzinfo=UTC)),
    ],
)
def test_entries_older_than_six_months_are_deletable(now: datetime, cutoff: datetime) -> None:
    assert ActivityLog.deletable_before(now) == cutoff
