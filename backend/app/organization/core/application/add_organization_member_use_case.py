from app.access.core.application.authorizer import Authorizer
from app.access.core.application.requires_permission import requires_permission
from app.access.core.domain.enums.permission_enum import PermissionEnum
from app.access.core.ports.user_port import UserPort
from app.activity.core.ports.spi.db.repositories.notification_port import (
    NotificationPort,
)
from app.organization.core.domain.entities.organization_member import (
    OrganizationMember,
)
from app.organization.core.domain.enums.member_status import MemberStatus
from app.organization.core.domain.exceptions import (
    MemberAlreadyExistsError,
    OrganizationNotFoundError,
    UserNotFoundError,
)
from app.organization.core.ports.api.add_organization_member_port import (
    AddOrganizationMemberPort,
)
from app.organization.core.ports.api.commands.add_organization_member_command import (
    AddOrganizationMemberCommand,
)
from app.organization.core.ports.spi.db.repositories.organization_member_port import (
    OrganizationMemberPort,
)
from app.organization.core.ports.spi.db.repositories.organization_port import (
    OrganizationPort,
)
from app.shared.core.ports.api.actor import Actor


class AddOrganizationMemberUseCase(AddOrganizationMemberPort):
    def __init__(
        self,
        organization_repository: OrganizationPort,
        member_repository: OrganizationMemberPort,
        user_repository: UserPort,
        notification_repository: NotificationPort,
        authorizer: Authorizer,
    ) -> None:
        self._organization_repository = organization_repository
        self._member_repository = member_repository
        self._user_repository = user_repository
        self._notification_repository = notification_repository
        self._authorizer = authorizer

    @requires_permission(PermissionEnum.ADD_ORGANIZATION_MEMBER)
    def execute(self, actor: Actor, command: AddOrganizationMemberCommand) -> OrganizationMember:
        if self._organization_repository.get_by_id(command.organization_id) is None:
            raise OrganizationNotFoundError(command.organization_id)
        if not self._user_repository.exists_by_id(command.user_id):
            raise UserNotFoundError(command.user_id)
        if self._member_repository.exists(command.organization_id, command.user_id):
            raise MemberAlreadyExistsError(command.organization_id, command.user_id)

        new_member = OrganizationMember(
            id=None,
            organization_id=command.organization_id,
            user_id=command.user_id,
            status=MemberStatus.INVITED,
            email=command.email,
            phone=command.phone,
            job_title=command.job_title,
            avatar_url=command.avatar_url,
        )
        # TODO Wysyłanie powiadomienia
        # self._notification_port.invite_member(
        #     member_id=new_member.id,
        #     organization_id=new_member.organization_id,
        # )

        return self._member_repository.create_obj(new_member)
