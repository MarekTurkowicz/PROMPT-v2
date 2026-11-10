from app.organization.adapter.outbound.relational_db.organization import (
    Organization as OrganizationModel,
)
from app.organization.core.domain.entities.organization import (
    Organization as OrganizationEntity,
)

from app.organization.adapter.outbound.relational_db.organization_mapper import (
    OrganizationMapper,
)
from app.organization.core.ports.spi.db.repositories.organization_port import (
    OrganizationPort,
)


class OrganizationRepository(OrganizationPort):
    # def get_all(self) -> list[OrganizationEntity]:
    #     return list(
    #         OrganizationMapper.to_entity(organization_model)
    #         for organization_model in OrganizationModel.objects.all()
    #     )

    def exists_by_tax_id(self, tax_id: str) -> bool:
        return OrganizationModel.objects.filter(tax_id=tax_id).exists()

    def get_by_id(self, organization_id: int) -> OrganizationEntity | None:
        try:
            model = OrganizationModel.objects.get(pk=organization_id)
        except OrganizationModel.DoesNotExist:
            return None
        return OrganizationMapper.to_entity(model)

    def create_obj(self, organization_entity: OrganizationEntity) -> OrganizationEntity:
        model = OrganizationMapper.to_model(organization_entity)
        model.pk = None
        model.save(force_insert=True)
        return OrganizationMapper.to_entity(model)

    def update_obj(self, organization_entity: OrganizationEntity) -> OrganizationEntity:
        model = OrganizationMapper.to_model(organization_entity)
        model.save()
        return OrganizationMapper.to_entity(model)

    # def delete_by_id(self, obj_id: int) -> bool:
    #     deleted_count, _ = OrganizationModel.objects.filter(id=obj_id).delete()
    #     return deleted_count > 0
