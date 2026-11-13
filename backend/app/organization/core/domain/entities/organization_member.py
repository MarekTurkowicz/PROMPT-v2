from dataclasses import dataclass
from datetime import datetime

from app.organization.core.domain.constants import (
    MEMBER_AVATAR_URL_MAX_LENGTH,
    MEMBER_EMAIL_MAX_LENGTH,
    MEMBER_JOB_TITLE_MAX_LENGTH,
    MEMBER_PHONE_MAX_LENGTH,
)
from app.organization.core.domain.exceptions import InvalidMemberProfile
from app.organization.core.domain.value_objects.member_status import MemberStatus


@dataclass(frozen=True, slots=True)
class OrganizationMember:
    id: int | None
    user_id: int
    organization_id: int
    status: MemberStatus
    email: str | None = None
    phone: str | None = None
    job_title: str | None = None
    avatar_url: str | None = None
    joined_at: datetime | None = None

    def __post_init__(self) -> None:
        for field_name, max_length in (
            ("email", MEMBER_EMAIL_MAX_LENGTH),
            ("phone", MEMBER_PHONE_MAX_LENGTH),
            ("job_title", MEMBER_JOB_TITLE_MAX_LENGTH),
            ("avatar_url", MEMBER_AVATAR_URL_MAX_LENGTH),
        ):
            value = getattr(self, field_name)

            if value is not None and len(value) > max_length:
                raise InvalidMemberProfile(
                    self,
                    f"{field_name} must be at most {max_length} characters.",
                )
