from typing import Any

from rest_framework import serializers

from app.organization.core.ports.api.commands.update_organization_settings_command import (
    UpdateOrganizationSettingsCommand,
)


# TODO Nie wywala z typowaniem błędu mypy ale z tego co wiem jest źle ze względu na create()
class UpdateOrganizationSettingsDeserializer(
    serializers.Serializer[UpdateOrganizationSettingsCommand]
):
    timezone = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    currency = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    priority_levels = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True,
    )

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError(
                "At least one settings field is required."
            )
        return attrs

    def validate_timezone(self, value: str | None) -> str | None:
        return _blank_to_none(value)

    def validate_currency(self, value: str | None) -> str | None:
        return _blank_to_none(value)

    def create_command(self, organization_id: int) -> UpdateOrganizationSettingsCommand:
        return UpdateOrganizationSettingsCommand(
            organization_id=organization_id,
            **self.validated_data,
        )


def _blank_to_none(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    return value
