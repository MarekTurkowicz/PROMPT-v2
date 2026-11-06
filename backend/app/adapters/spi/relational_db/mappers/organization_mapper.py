from typing import Any

from app.adapters.spi.relational_db.models.organization import Organization as OrganizationModel
from app.domain.entities.organization import Organization as OrganizationEntity
from app.domain.value_objects.organization_settings import OrganizationSettings
from app.ports.spi.db.base_mapper import BaseMapper


class OrganizationMapper(BaseMapper[OrganizationModel, OrganizationEntity]):
    @staticmethod
    def to_entity(model: OrganizationModel) -> OrganizationEntity:
        return OrganizationEntity(
            id=model.pk,
            name=model.name,
            tax_id=model.tax_id,
            is_active=model.is_active,
            settings=OrganizationMapper._settings_to_entity(model.settings),
            created_at=model.created_at,
            modified_at=model.modified_at,
        )

    @staticmethod
    def to_model(entity: OrganizationEntity) -> OrganizationModel:
        model = OrganizationModel(
            name=entity.name,
            tax_id=entity.tax_id,
            is_active=entity.is_active,
            settings=OrganizationMapper._settings_to_model(entity.settings),
        )
        if entity.id is not None:
            model.pk = entity.id
        if entity.created_at is not None:
            model.created_at = entity.created_at
        if entity.modified_at is not None:
            model.modified_at = entity.modified_at
        return model

    # TODO typowanie
    @staticmethod
    def _settings_to_entity(raw: Any) -> OrganizationSettings:
        if not raw:
            return OrganizationSettings(None, None, None)
        # if not isinstance(raw, dict):
        #     raise ValueError("Organization settings must be a JSON object.")

        # TODO do przegadania i sprawdzenia
        levels : tuple[str,str,str,str,str] | None = raw.get("priority_levels", None)
        if not isinstance(levels, (None, tuple)):
            raise ValueError("priority_levels are in incorrect format", levels)
        if levels is not None and len(levels)!=5:
            raise ValueError("priority_levels len is not equal 5", levels)

        timezone = raw.get("timezone", None)
        currency = raw.get("currency", None)
        return OrganizationSettings(
            timezone=str(timezone) if timezone else None,
            currency=str(currency) if currency else None,
            priority_levels=levels
            )

    # TODO typowanie
    @staticmethod
    def _settings_to_model(settings: OrganizationSettings) -> dict[str, Any]:
        return {
            "timezone": settings.timezone,
            "currency": settings.currency,
            "priority_levels": settings.priority_levels,
        }
