from rest_framework.views import APIView

class OrganizationView(APIView):
    pass
    # def post(self, request, *args, **kwargs):
    #     serializer = CreateOrganizationSerializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)
    #
    #     command = CreateOrganizationCommand(
    #         **serializer.validated_data
    #     )
    #
    #     use_case = container(
    #         repository=DjangoOrganizationRepository()
    #     )
    #
    #     organization = use_case.execute(command)
    #
    #     return Response(
    #         {
    #             "id": str(organization.id),
    #             "name": organization.name,
    #             "nip": organization.nip,
    #         },
    #         status=status.HTTP_201_CREATED,
    #     )
