from app.adapter.spi.relational_db.organization import Organization as OrganizationModel
from app.domain.entities.organization import Organization as OrganizationEntity

from app.adapter.spi.relational_db.mappers.organizational_mapper import (
    OrganizationMapper,
)
from app.ports.spi.db.repositories.base_port import BasePort


class OrganizationRepository(BasePort[OrganizationEntity]):
    def get_by_id(self, obj_id: int) -> OrganizationEntity | None:
        try:
            model = OrganizationModel.objects.get(id=obj_id)
            return OrganizationMapper.to_entity(model)
        except OrganizationModel.DoesNotExist:
            return None

    def get_all(self) -> list[OrganizationEntity]:
        return list(
            OrganizationMapper.to_entity(organization_model)
            for organization_model in OrganizationModel.objects.all()
        )

    def create_obj(self, obj: OrganizationEntity) -> OrganizationEntity:
        model = OrganizationMapper.to_model(obj)
        model.pk = None
        model.save(force_insert=True)
        return OrganizationMapper.to_entity(model)

    def update_obj(self, obj: OrganizationEntity) -> OrganizationEntity:
        model = OrganizationMapper.to_model(obj)
        model.save()
        return OrganizationMapper.to_entity(obj)

    def delete_by_id(self, obj_id: int) -> bool:
        deleted_count, _ = OrganizationModel.objects.filter(id=obj_id).delete()
        return deleted_count > 0
