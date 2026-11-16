from enum import StrEnum


class MemberStatus(StrEnum):
    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    LEFT = "left"
