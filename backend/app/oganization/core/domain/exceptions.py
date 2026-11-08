class DomainException(Exception):
    pass

class InvalidOrganizationName(DomainException):
    organization_name: str
    exception_message: str

    def __init__(self, organization_name: str, msg: str) -> None:
        self.organization_name = organization_name
        self.exception_message = f"Invalid organization name: {self.organization_name} Reason: {msg}"
        super().__init__(self.exception_message)

class InvalidTaxId(DomainException):
    tax_id: str

    def __init__(self, tax_id: str, msg: str) -> None:
        self.tax_id = tax_id
        self.exception_message = f"Invalid tax_id: {self.tax_id} Reason: {msg}"
        super().__init__(self.exception_message)

class InvalidOrganizationSettings(DomainException):
    pass


class OrganizationNotFound(DomainException):
    def __init__(self, organization_id: int) -> None:
        self.organization_id = organization_id
        super().__init__(f"Organization {organization_id} does not exist.")

class TaxIdDuplicationException(DomainException):
    tax_id : str

    def __init__(self, tax_id: str) -> None:
        self.tax_id = tax_id
        super().__init__(f"An organization with tax_id {tax_id} already exists")
