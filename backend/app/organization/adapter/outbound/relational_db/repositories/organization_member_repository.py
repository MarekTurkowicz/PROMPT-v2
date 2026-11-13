from django.db import IntegrityError, transaction

from app.organization.adapter.outbound.relational_db.models.organization_member import (
    OrganizationMember as OrganizationMemberModel,
)
from app.organization.adapter.outbound.relational_db.mappers.organization_member_mapper import (
    OrganizationMemberMapper,
)
from app.organization.core.domain.entities.organization_member import (
    OrganizationMember as OrganizationMemberEntity,
)
from app.organization.core.domain.exceptions import MemberAlreadyExists
from app.organization.core.ports.spi.db.repositories.organization_member_port import (
    OrganizationMemberPort,
)


class OrganizationMemberRepository(OrganizationMemberPort):
    def exists(self, organization_id: int, user_id: int) -> bool:
        return OrganizationMemberModel.objects.filter(
            organization_id=organization_id, user_id=user_id
        ).exists()

    def create_obj(
        self, member_entity: OrganizationMemberEntity
    ) -> OrganizationMemberEntity:
        model = OrganizationMemberMapper.to_model(member_entity)
        model.pk = None
        model.save(force_insert=True)
        return OrganizationMemberMapper.to_entity(model)
