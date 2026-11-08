from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.oganization.adapter.inbound.django.container import get_container
from app.oganization.adapter.inbound.django.serializers.update_organization_settings_serializer import (
    UpdateOrganizationSettingsSerializer,
)
from app.oganization.core.domain.exceptions import (
    InvalidOrganizationSettings,
    OrganizationNotFound,
)
from app.oganization.core.ports.api.update_organization_settings_port import (
    UpdateOrganizationSettingsPort,
)


class OrganizationSettingsView(APIView):
    def patch(self, request: Request, organization_id: int, *args: object, **kwargs: object) -> Response:
        serializer = UpdateOrganizationSettingsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        command = serializer.create_command(organization_id)

        update_settings: UpdateOrganizationSettingsPort = (
            get_container().update_organization_settings
        )
        try:
            organization = update_settings.execute(command)
        except OrganizationNotFound as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except InvalidOrganizationSettings as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

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
