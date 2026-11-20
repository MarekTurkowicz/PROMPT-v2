from enum import StrEnum


class FundingType(StrEnum):
    GRANT = "grant"
    SPONSORSHIP = "sponsorship"
    DONATION = "donation"
    INTERNAL = "internal"
