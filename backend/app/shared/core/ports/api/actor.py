from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Actor:
    user_id: int
    is_superuser: bool
