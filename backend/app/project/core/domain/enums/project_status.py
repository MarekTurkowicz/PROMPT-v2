from enum import StrEnum


class ProjectStatus(StrEnum):
    PLANNED = "planned"
    ACTIVE = "active"
    CLOSED = "closed"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"
