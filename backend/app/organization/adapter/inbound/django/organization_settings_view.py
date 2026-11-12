from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.organization.adapter.inbound.django.serializers.update_organization_settings_serializer import (
    UpdateOrganizationSettingsSerializer,
)
from app.organization.core.ports.api.update_organization_settings_port import (
    UpdateOrganizationSettingsPort,
)


# TODO Sprawdzenie uprawnień
class OrganizationSettingsView(APIView):
    update_organization_settings: UpdateOrganizationSettingsPort = None  # type: ignore[assignment]  # set via as_view()

    def patch(
        self, request: Request, organization_id: int, *args: object, **kwargs: object
    ) -> Response:
        serializer = UpdateOrganizationSettingsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        command = serializer.create_command(organization_id)
        organization = self.update_organization_settings.execute(command)
        levels = organization.settings.priority_levels
        return Response(
            {
                "id": organization.id,
                "timezone": organization.settings.timezone,
                "currency": organization.settings.currency,
                "priority_levels": None if levels is None else list(levels),
            },
            status=status.HTTP_200_OK,
        )
