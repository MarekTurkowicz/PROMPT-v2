from typing import Protocol

from app.oganization.core.domain.entities.organization import Organization


class OrganizationPort(Protocol):
    def exists_by_tax_id(self, tax_id: str) -> bool: ...
    def create_obj(self, obj: Organization) -> Organization: ...
