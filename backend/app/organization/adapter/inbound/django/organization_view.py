from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.organization.adapter.inbound.django.serializers.create_organization_serializer import (
    CreateOrganizationSerializer,
)
from app.organization.core.domain.exceptions import (
    InvalidOrganizationName,
    InvalidOrganizationSettings,
    InvalidTaxId,
    TaxIdDuplicationException,
)
from app.organization.core.ports.api.create_organization_port import (
    CreateOrganizationPort,
)


class OrganizationView(APIView):
    create_organization: CreateOrganizationPort = None  # type: ignore[assignment]  # set via as_view()

    def post(self, request: Request, *args: object, **kwargs: object) -> Response:
        serializer = CreateOrganizationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        command = serializer.create_command()

        # TODO Poprawa resultów/strukturyzacja

        try:
            organization = self.create_organization.execute(command)
        except (
            InvalidOrganizationName,
            InvalidTaxId,
            InvalidOrganizationSettings,
        ) as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except TaxIdDuplicationException as e:
            return Response({"detail": str(e)}, status=status.HTTP_409_CONFLICT)

        return Response(
            {
                "id": None if organization.id is None else str(organization.id),
                "name": organization.name,
                "tax_id": (
                    None if organization.tax_id is None else str(organization.tax_id)
                ),
            },
            status=status.HTTP_201_CREATED,
        )
