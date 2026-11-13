from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.organization.adapter.inbound.django.serializers.add_organization_member_deserializer import (
    AddOrganizationMemberDeserializer,
)
from app.organization.core.ports.api.add_organization_member_port import (
    AddOrganizationMemberPort,
)


# TODO Sprawdzenie uprawnień
class OrganizationMembersView(APIView):
    add_organization_member: AddOrganizationMemberPort = None  # type: ignore[assignment]  # set via as_view()

    def post(
        self, request: Request, organization_id: int, *args: object, **kwargs: object
    ) -> Response:
        serializer = AddOrganizationMemberDeserializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        command = serializer.create_command(organization_id)
        member = self.add_organization_member.execute(command)
        return Response(
            {
                "id": member.id,
                "organization_id": member.organization_id,
                "user_id": member.user_id,
                "status": member.status.value,
                "email": member.email,
                "phone": member.phone,
                "job_title": member.job_title,
                "avatar_url": member.avatar_url,
                "joined_at": member.joined_at,
            },
            status=status.HTTP_201_CREATED,
        )
