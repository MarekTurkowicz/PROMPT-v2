from rest_framework import serializers

from app.organization.core.ports.api.commands.create_organization_command import (
    CreateOrganizationCommand,
)


class CreateOrganizationDeserializer(serializers.Serializer[CreateOrganizationCommand]):
    name = serializers.CharField()
    tax_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    timezone = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    currency = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    priority_levels = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True,
    )

    def validate_tax_id(self, value: str | None) -> str | None:
        return _blank_to_none(value)

    def validate_timezone(self, value: str | None) -> str | None:
        return _blank_to_none(value)

    def validate_currency(self, value: str | None) -> str | None:
        return _blank_to_none(value)

    def create_command(self) -> CreateOrganizationCommand:
        data = self.validated_data
        return CreateOrganizationCommand(
            name=data["name"],
            tax_id=data.get("tax_id"),
            timezone=data.get("timezone"),
            currency=data.get("currency"),
            priority_levels=data.get("priority_levels"),
        )


def _blank_to_none(value: str | None) -> str | None:
    if value is None or not value.strip():
        return None
    return value
