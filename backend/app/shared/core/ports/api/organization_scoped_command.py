from typing import Protocol, runtime_checkable


@runtime_checkable
class OrganizationScopedCommand(Protocol):
    @property
    def organization_id(self) -> int: ...
