from app.adapter.spi.relational_db.organization import Organization as OrganizationModel
from app.domain.entities.organization import Organization as OrganizationEntity
from app.ports.spi.db.base_mapper import BaseMapper


class OrganizationMapper(BaseMapper[OrganizationModel, OrganizationEntity]):
    @staticmethod
    def to_entity(model: OrganizationModel) -> OrganizationEntity:
        raise NotImplementedError

    @staticmethod
    def to_model(entity: OrganizationEntity) -> OrganizationModel:
        raise NotImplementedError
