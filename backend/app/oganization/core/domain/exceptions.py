class DomainException(Exception):
    pass

class InvalidOrganizationName(DomainException):
    pass

class InvalidTaxId(DomainException):
    pass

class InvalidOrganizationSettings(DomainException):
    pass

class TaxIdDuplicationException(DomainException):
    pass
