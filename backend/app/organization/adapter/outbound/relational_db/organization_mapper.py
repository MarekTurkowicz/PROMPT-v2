from typing import Any

from app.organization.adapter.outbound.relational_db.organization import (
    Organization as OrganizationModel,
)
from app.organization.core.domain.entities.organization import (
    Organization as OrganizationEntity,
)
from app.organization.core.domain.exceptions import InvalidOrganizationSettings
from app.organization.core.domain.value_objects.organization_settings import (
    OrganizationSettings,
)
from app.organization.core.domain.value_objects.organization_tax_id import (
    OrganizationTaxId,
)
from app.shared.core.ports.spi.db.base_mapper import BaseMapper


class OrganizationMapper(BaseMapper[OrganizationModel, OrganizationEntity]):
    @staticmethod
    def to_entity(model: OrganizationModel) -> OrganizationEntity:
        return OrganizationEntity(
            id=model.pk,
            name=model.name,
            tax_id=OrganizationTaxId(model.tax_id) if model.tax_id else None,
            is_active=model.is_active,
            settings=OrganizationMapper._settings_to_entity(model.settings),
            created_at=model.created_at,
            modified_at=model.modified_at,
        )

    @staticmethod
    def to_model(entity: OrganizationEntity) -> OrganizationModel:
        model = OrganizationModel(
            name=entity.name,
            tax_id=None if entity.tax_id is None else entity.tax_id.value,
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
        if not isinstance(raw, dict):
            raise InvalidOrganizationSettings(
                "Organization settings must be a JSON object."
            )

        levels = raw.get("priority_levels")
        if levels is not None and not isinstance(levels, (list, tuple)):
            raise InvalidOrganizationSettings("priority_levels are in incorrect format")

        timezone = raw.get("timezone")
        currency = raw.get("currency")
        return OrganizationSettings(
            timezone=str(timezone) if timezone else None,
            currency=str(currency) if currency else None,
            priority_levels=levels,
        )

    # TODO typowanie
    @staticmethod
    def _settings_to_model(settings: OrganizationSettings) -> dict[str, Any]:
        return {
            "timezone": settings.timezone,
            "currency": settings.currency,
            "priority_levels": settings.priority_levels,
        }
