from typing import Protocol


class UserPort(Protocol):
    def exists_by_id(self, user_id: int) -> bool: ...
