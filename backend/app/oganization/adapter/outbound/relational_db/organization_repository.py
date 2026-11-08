from app.oganization.adapter.outbound.relational_db.organization import (
    Organization as OrganizationModel,
)
from app.oganization.core.domain.entities.organization import (
    Organization as OrganizationEntity,
)

from app.oganization.adapter.outbound.relational_db.organization_mapper import (
    OrganizationMapper,
)
from app.oganization.core.ports.spi.db.repositories.organization_port import (
    OrganizationPort,
)
from app.shared.ports.spi.db.base_port import BasePort


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

    def create_obj(self, organization_model: OrganizationEntity) -> OrganizationEntity:
        model = OrganizationMapper.to_model(organization_model)
        model.pk = None
        model.save(force_insert=True)
        return OrganizationMapper.to_entity(model)

    def update_obj(self, organization_model: OrganizationEntity) -> OrganizationEntity:
        model = OrganizationMapper.to_model(organization_model)
        model.save()
        return OrganizationMapper.to_entity(model)

    # def delete_by_id(self, obj_id: int) -> bool:
    #     deleted_count, _ = OrganizationModel.objects.filter(id=obj_id).delete()
    #     return deleted_count > 0
