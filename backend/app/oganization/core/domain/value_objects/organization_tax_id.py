import re
from dataclasses import dataclass

from app.oganization.core.domain.constants import POLISH_TAX_ID_WEIGHTS
from app.oganization.core.domain.exceptions import InvalidTaxId


@dataclass(frozen=True, slots=True)
class OrganizationTaxId:
    value: str

    def __post_init__(self) -> None:
        self._validate_pl_tax_id()

    def _validate_pl_tax_id(self):
        normalized = re.sub(r"[\s-]", "", self.value)

        if not re.fullmatch(r"\d{10}", normalized):
            raise InvalidTaxId("Invalid tax_id format")

        checksum = sum(
            int(digit) * weight
            for digit, weight in zip(normalized[:9], POLISH_TAX_ID_WEIGHTS)
        ) % 11

        if checksum == 10 or checksum != int(normalized[9]):
            raise InvalidTaxId("Invalid tax_id checksum")

        object.__setattr__(self, "value", normalized)

    def __str__(self) -> str:
        return self.value
