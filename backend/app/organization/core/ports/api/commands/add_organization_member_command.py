from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class AddOrganizationMemberCommand:
    organization_id: int
    user_id: int
    email: str | None = None
    phone: str | None = None
    job_title: str | None = None
    avatar_url: str | None = None
