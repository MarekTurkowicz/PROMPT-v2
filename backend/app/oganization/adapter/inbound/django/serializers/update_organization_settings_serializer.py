from rest_framework import serializers

from app.oganization.core.ports.api.commands.update_organization_settings_command import (
    UpdateOrganizationSettingsCommand,
)


class UpdateOrganizationSettingsSerializer(serializers.Serializer):
    timezone = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    currency = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    priority_levels = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True,
    )

    def validate(self, attrs: dict) -> dict:
        if not attrs:
            raise serializers.ValidationError("At least one settings field is required.")
        return attrs

    def validate_timezone(self, value: str | None) -> str | None:
        return _blank_to_none(value)

    def validate_currency(self, value: str | None) -> str | None:
        return _blank_to_none(value)

    def create_command(self, organization_id: int) -> UpdateOrganizationSettingsCommand:
        data = self.validated_data
        return UpdateOrganizationSettingsCommand(
            organization_id=organization_id,
            **data,
        )


def _blank_to_none(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    return value
