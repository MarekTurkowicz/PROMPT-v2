from app.adapter.spi.relational_db.organization import Organization as OrganizationModel
from app.domain.entities.organization import Organization as OrganizationEntity


class OrganizationMapper:
    @staticmethod
    def to_domain(model: OrganizationModel) -> OrganizationEntity:
        pass

    @staticmethod
    def to_model(entity: OrganizationEntity) -> OrganizationModel:
        pass
