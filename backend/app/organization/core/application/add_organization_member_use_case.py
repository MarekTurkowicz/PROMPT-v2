from app.activity.core.ports.spi.db.repositories.notification_port import (
    NotificationPort,
)
from app.organization.core.domain.entities.organization_member import (
    OrganizationMember,
)
from app.organization.core.domain.exceptions import (
    MemberAlreadyExists,
    OrganizationNotFound,
    UserNotFound,
)
from app.organization.core.domain.value_objects.member_status import MemberStatus
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
from app.organization.core.ports.spi.db.repositories.user_port import UserPort


class AddOrganizationMemberUseCase(AddOrganizationMemberPort):
    def __init__(
        self,
        organization_repository: OrganizationPort,
        member_repository: OrganizationMemberPort,
        user_repository: UserPort,
        notification_repository: NotificationPort,
    ) -> None:
        self._organization_repository = organization_repository
        self._member_repository = member_repository
        self._user_repository = user_repository
        self._notification_repository = notification_repository

    def execute(self, command: AddOrganizationMemberCommand) -> OrganizationMember:
        # TODO Sprawdzanie uprawnień
        if self._organization_repository.get_by_id(command.organization_id) is None:
            raise OrganizationNotFound(command.organization_id)
        if not self._user_repository.exists_by_id(command.user_id):
            raise UserNotFound(command.user_id)
        if self._member_repository.exists(command.organization_id, command.user_id):
            raise MemberAlreadyExists(command.organization_id, command.user_id)

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
