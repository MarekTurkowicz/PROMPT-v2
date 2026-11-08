from django.apps import apps
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.apps import ApplicationConfig
from app.oganization.adapter.inbound.django.create_organization_serializer import (
    CreateOrganizationSerializer,
)
from app.oganization.core.domain.exceptions import (
    InvalidOrganizationName,
    InvalidOrganizationSettings,
    InvalidTaxId,
    TaxIdDuplicationException,
)


class OrganizationView(APIView):
    def post(self, request: Request, *args: object, **kwargs: object) -> Response:
        serializer = CreateOrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        command = serializer.create_command()

        application = apps.get_app_config("app")
        if not isinstance(application, ApplicationConfig):
            raise RuntimeError("Application container is unavailable.")

        #TODO Poprawa resultów/strukturyzacja

        try:
            organization = application.container.create_organization.execute(command)
        except (InvalidOrganizationName, InvalidTaxId, InvalidOrganizationSettings) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except TaxIdDuplicationException as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)

        return Response(
            {
                "id": None if organization.id is None else str(organization.id),
                "name": organization.name,
                "tax_id": None if organization.tax_id is None else str(organization.tax_id),
            },
            status=status.HTTP_201_CREATED,
        )
