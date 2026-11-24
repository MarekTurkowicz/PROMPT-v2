from datetime import datetime

from app.activity.adapter.outbound.relational_db.mappers.activity_log_mapper import (
    ActivityLogMapper,
)
from app.activity.adapter.outbound.relational_db.models.activity_log import (
    ActivityLog as ActivityLogModel,
)
from app.activity.core.domain.entities.activity_log import (
    ActivityLog as ActivityLogEntity,
)
from app.activity.core.ports.api.queries.list_activity_query import ListActivityQuery
from app.activity.core.ports.spi.db.repositories.activity_log_port import ActivityLogPort


class ActivityLogRepository(ActivityLogPort):
    def append(self, entry: ActivityLogEntity) -> ActivityLogEntity:
        model = ActivityLogMapper.to_model(entry)
        model.pk = None
        model.save(force_insert=True)
        return ActivityLogMapper.to_entity(model)

    def list(self, query: ListActivityQuery) -> list[ActivityLogEntity]:
        models = ActivityLogModel.objects.filter(organization_id=query.organization_id)
        if query.actor_id is not None:
            models = models.filter(actor_id=query.actor_id)
        if query.entity_types:
            models = models.filter(entity_type__in=[entity_type.value for entity_type in query.entity_types])
        if query.actions:
            models = models.filter(action__in=[action.value for action in query.actions])
        if query.entity_id is not None:
            models = models.filter(entity_id=query.entity_id)
        if query.created_from is not None:
            models = models.filter(created_at__gte=query.created_from)
        if query.created_to is not None:
            models = models.filter(created_at__lt=query.created_to)

        page = models.order_by("-created_at", "-id")[query.offset : query.offset + query.limit]
        return [ActivityLogMapper.to_entity(model) for model in page]

    def delete_older_than(self, organization_id: int, cutoff: datetime) -> int:
        deleted, _ = ActivityLogModel.objects.filter(
            organization_id=organization_id, created_at__lt=cutoff
        ).delete()
        return deleted
