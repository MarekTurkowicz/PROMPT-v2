from app.organization.adapter.outbound.relational_db.models.organization_member import (
    OrganizationMember as OrganizationMemberModel,
)
from app.organization.core.domain.entities.organization_member import (
    OrganizationMember as OrganizationMemberEntity,
)
from app.organization.core.domain.value_objects.member_status import MemberStatus
from app.shared.core.ports.spi.db.base_mapper import BaseMapper


class OrganizationMemberMapper(
    BaseMapper[OrganizationMemberModel, OrganizationMemberEntity]
):
    @staticmethod
    def to_entity(model: OrganizationMemberModel) -> OrganizationMemberEntity:
        return OrganizationMemberEntity(
            id=model.pk,
            organization_id=model.organization_id,
            user_id=model.user_id,
            status=MemberStatus(model.status),
            email=model.email,
            phone=model.phone,
            job_title=model.job_title,
            avatar_url=model.avatar_url,
            joined_at=model.joined_at,
        )

    @staticmethod
    def to_model(entity: OrganizationMemberEntity) -> OrganizationMemberModel:
        model = OrganizationMemberModel(
            organization_id=entity.organization_id,
            user_id=entity.user_id,
            status=entity.status.value,
            email=entity.email,
            phone=entity.phone,
            job_title=entity.job_title,
            avatar_url=entity.avatar_url,
            joined_at=entity.joined_at,
        )
        if entity.id is not None:
            model.pk = entity.id
        return model
