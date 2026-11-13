from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.organization.adapter.inbound.django.serializers.create_organization_deserializer import (
    CreateOrganizationDeserializer,
)
from app.organization.core.ports.api.create_organization_port import (
    CreateOrganizationPort,
)


# TODO Sprawdzenie uprawnień
class OrganizationView(APIView):
    create_organization: CreateOrganizationPort = None  # type: ignore[assignment]  # set via as_view()

    def post(self, request: Request, *args: object, **kwargs: object) -> Response:
        serializer = CreateOrganizationDeserializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        command = serializer.create_command()
        organization = self.create_organization.execute(command)
        # TODO Response można jeszcze jakoś uprościć
        return Response(
            {
                "id": organization.id,
                "name": organization.name,
                "tax_id": organization.tax_id,
            },
            status=status.HTTP_201_CREATED,
        )
