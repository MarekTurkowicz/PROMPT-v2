from rest_framework import serializers

from app.organization.core.domain.constants import (
    MEMBER_AVATAR_URL_MAX_LENGTH,
    MEMBER_EMAIL_MAX_LENGTH,
    MEMBER_JOB_TITLE_MAX_LENGTH,
    MEMBER_PHONE_MAX_LENGTH,
)
from app.organization.core.ports.api.commands.add_organization_member_command import (
    AddOrganizationMemberCommand,
)


class AddOrganizationMemberDeserializer(
    serializers.Serializer[AddOrganizationMemberCommand]
):
    # TODO typowanie UUID/int
    user_id = serializers.IntegerField(min_value=1)
    email = serializers.EmailField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=MEMBER_EMAIL_MAX_LENGTH,
    )
    phone = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=MEMBER_PHONE_MAX_LENGTH,
    )
    job_title = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=MEMBER_JOB_TITLE_MAX_LENGTH,
    )
    avatar_url = serializers.URLField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=MEMBER_AVATAR_URL_MAX_LENGTH,
    )

    def validate_email(self, value: str | None) -> str | None:
        return _blank_to_none(value)

    def validate_phone(self, value: str | None) -> str | None:
        return _blank_to_none(value)

    def validate_job_title(self, value: str | None) -> str | None:
        return _blank_to_none(value)

    def validate_avatar_url(self, value: str | None) -> str | None:
        return _blank_to_none(value)

    def create_command(self, organization_id: int) -> AddOrganizationMemberCommand:
        data = self.validated_data
        return AddOrganizationMemberCommand(
            organization_id=organization_id,
            user_id=data["user_id"],
            email=data.get("email"),
            phone=data.get("phone"),
            job_title=data.get("job_title"),
            avatar_url=data.get("avatar_url"),
        )


def _blank_to_none(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    return value
