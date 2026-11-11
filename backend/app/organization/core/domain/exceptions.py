from typing import ClassVar

from app.organization.core.domain.value_objects.organization_settings import (
    OrganizationSettings,
)
from app.shared.core.domain.error_kind import ErrorKind
from app.shared.core.domain.exceptions import DomainException


class InvalidOrganizationName(DomainException):
    kind: ClassVar[ErrorKind] = ErrorKind.INVALID
    code: ClassVar[str] = "organization.invalid_name"
    organization_name: str
    exception_message: str

    def __init__(self, organization_name: str, msg: str) -> None:
        self.organization_name = organization_name
        self.exception_message = (
            f"Invalid organization name: {self.organization_name}\nReason: {msg}"
        )
        super().__init__(self.exception_message)


class InvalidTaxId(DomainException):
    kind = ErrorKind.INVALID
    code = "organization.invalid_tax_id"
    tax_id: str

    def __init__(self, tax_id: str, msg: str) -> None:
        self.tax_id = tax_id
        self.exception_message = f"Invalid tax_id: {self.tax_id}\n" f"Reason: {msg}"
        super().__init__(self.exception_message)


class InvalidOrganizationSettings(DomainException):
    abstract = True


class InvalidOrganizationSettingsState(InvalidOrganizationSettings):
    kind = ErrorKind.INVALID
    code = "organization.invalid_organization_settings_state"
    organization_settings: OrganizationSettings

    def __init__(self, organization_settings: OrganizationSettings, msg: str) -> None:
        self.organization_settings = organization_settings
        super().__init__(
            f"Organization settings are invalid\n"
            f"Reason: {msg}\n"
            f"Organization_settings: {organization_settings}"
        )


class InvalidOrganizationSettingsData(InvalidOrganizationSettings):
    kind = ErrorKind.INVALID
    code = "organization.invalid_organization_settings_data"
    raw_data: dict

    def __init__(self, raw_data: dict, msg: str) -> None:
        self.raw_data = raw_data
        super().__init__(
            f"Invalid data was passed, OrganizationSettings cannot be created\n"
            f"Reason: {msg}\n"
            f"raw_data: {raw_data}"
        )


class OrganizationNotFound(DomainException):
    kind = ErrorKind.NOT_FOUND
    code = "organization.organization_not_found"
    organization_id: int

    def __init__(self, organization_id: int) -> None:
        self.organization_id = organization_id
        super().__init__(f"Organization {organization_id} does not exist.")


class TaxIdDuplicationException(DomainException):
    kind = ErrorKind.CONFLICT
    code = "organization.tax_id_duplication"
    tax_id: str

    def __init__(self, tax_id: str) -> None:
        self.tax_id = tax_id
        super().__init__(f"An organization with tax_id {tax_id} already exists")
