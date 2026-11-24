from app.activity.adapter.outbound.relational_db.models.activity_log import (
    ActivityLog as ActivityLogModel,
)
from app.activity.core.domain.entities.activity_log import (
    ActivityLog as ActivityLogEntity,
)
from app.activity.core.domain.enums.activity_action import ActivityAction
from app.activity.core.domain.enums.entity_type import EntityType
from app.shared.core.ports.spi.db.base_mapper import BaseMapper


class ActivityLogMapper(BaseMapper[ActivityLogModel, ActivityLogEntity]):
    @staticmethod
    def to_entity(model: ActivityLogModel) -> ActivityLogEntity:
        return ActivityLogEntity(
            id=model.pk,
            organization_id=model.organization_id,
            actor_id=model.actor_id,
            entity_type=EntityType(model.entity_type),
            entity_id=model.entity_id,
            action=ActivityAction(model.action),
            changes={field: (old, new) for field, (old, new) in model.changes.items()},
            created_at=model.created_at,
        )

    @staticmethod
    def to_model(entity: ActivityLogEntity) -> ActivityLogModel:
        model = ActivityLogModel(
            organization_id=entity.organization_id,
            actor_id=entity.actor_id,
            entity_type=entity.entity_type.value,
            entity_id=entity.entity_id,
            action=entity.action.value,
            changes={field: [old, new] for field, (old, new) in entity.changes.items()},
        )
        if entity.id is not None:
            model.pk = entity.id
        return model
