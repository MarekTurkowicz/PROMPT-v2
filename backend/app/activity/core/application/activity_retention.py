from datetime import datetime

from app.activity.core.domain.entities.activity_log import ActivityLog
from app.activity.core.ports.spi.db.repositories.activity_log_port import ActivityLogPort
from app.organization.core.ports.spi.db.repositories.organization_port import OrganizationPort


# A system process run by the scheduler, not a user use case, so it has no actor or permission.
class ActivityRetention:
    def __init__(self, repository: ActivityLogPort, organization_repository: OrganizationPort) -> None:
        self._repository = repository
        self._organization_repository = organization_repository

    def delete_expired(self, now: datetime) -> int:
        cutoff = ActivityLog.deletable_before(now)
        return sum(
            self._repository.delete_older_than(organization.id, cutoff)
            for organization in self._organization_repository.get_all()
            if organization.id is not None
        )
