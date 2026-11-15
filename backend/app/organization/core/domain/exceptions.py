from typing import TYPE_CHECKING, ClassVar

from app.shared.core.domain.error_kind import ErrorKind
from app.shared.core.domain.exceptions import DomainError

if TYPE_CHECKING:
    from app.organization.core.domain.entities.organization_member import (
        OrganizationMember,
    )
    from app.organization.core.domain.value_objects.organization_settings import (
        OrganizationSettings,
    )


class InvalidOrganizationNameError(DomainError):
    kind: ClassVar[ErrorKind] = ErrorKind.INVALID
    code: ClassVar[str] = "organization.invalid_name"

    def __init__(self, organization_name: str, msg: str) -> None:
        self.exception_message = f"Invalid organization name: {organization_name}\nReason: {msg}"
        super().__init__(
            self.exception_message,
            organization_name=organization_name,
            msg=msg,
        )


class InvalidTaxIdError(DomainError):
    kind = ErrorKind.INVALID
    code = "organization.invalid_tax_id"

    def __init__(self, tax_id: str, msg: str) -> None:
        self.exception_message = f"Invalid tax_id: {tax_id}\nReason: {msg}"
        super().__init__(self.exception_message, tax_id=tax_id, msg=msg)


class InvalidOrganizationSettingsError(DomainError):
    abstract = True


class InvalidOrganizationSettingsStateError(InvalidOrganizationSettingsError):
    kind = ErrorKind.INVALID
    code = "organization.invalid_organization_settings_state"

    def __init__(self, organization_settings: OrganizationSettings, msg: str) -> None:
        super().__init__(
            f"Organization settings are invalid\n"
            f"Reason: {msg}\n"
            f"Organization_settings: {organization_settings}",
            organization_settings=organization_settings,
            msg=msg,
        )


class InvalidOrganizationSettingsDataError(InvalidOrganizationSettingsError):
    kind = ErrorKind.INVALID
    code = "organization.invalid_organization_settings_data"

    def __init__(self, raw_data: object, msg: str) -> None:
        super().__init__(
            f"Invalid data was passed, OrganizationSettings cannot be created\n"
            f"Reason: {msg}\n"
            f"raw_data: {raw_data}",
            raw_data=raw_data,
            msg=msg,
        )


class OrganizationNotFoundError(DomainError):
    kind = ErrorKind.NOT_FOUND
    code = "organization.organization_not_found"

    def __init__(self, organization_id: int) -> None:
        super().__init__(
            f"Organization {organization_id} does not exist.",
            organization_id=organization_id,
        )


class TaxIdDuplicationError(DomainError):
    kind = ErrorKind.CONFLICT
    code = "organization.tax_id_duplication"

    def __init__(self, tax_id: str) -> None:
        super().__init__(f"An organization with tax_id {tax_id} already exists", tax_id=tax_id)


class InvalidMemberProfileError(DomainError):
    kind = ErrorKind.INVALID
    code = "organization.invalid_member_profile"

    def __init__(self, organization_member: OrganizationMember, msg: str) -> None:
        super().__init__(
            f"Invalid member profile field: {organization_member}\nReason: {msg}",
            organization_member=organization_member,
            msg=msg,
        )


class UserNotFoundError(DomainError):
    kind = ErrorKind.NOT_FOUND
    code = "organization.user_not_found"

    def __init__(self, user_id: int) -> None:
        super().__init__(f"User with user_id: {user_id} does not exist.", user_id=user_id)


class MemberAlreadyExistsError(DomainError):
    kind = ErrorKind.CONFLICT
    code = "organization.member_already_exists"

    def __init__(self, organization_id: int, user_id: int) -> None:
        super().__init__(
            f"User {user_id} is already a member of organization {organization_id}.",
            organization_id=organization_id,
            user_id=user_id,
        )
