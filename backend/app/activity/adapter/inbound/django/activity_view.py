from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.activity.adapter.inbound.django.serializers.list_activity_deserializer import (
    ListActivityDeserializer,
)
from app.activity.core.ports.api.list_activity_port import ListActivityPort
from app.shared.adapter.inbound.django.actor import get_actor


class ActivityView(APIView):
    list_activity: ListActivityPort = None  # type: ignore[assignment]  # set via as_view()

    def get(self, request: Request, organization_id: int, *args: object, **kwargs: object) -> Response:
        serializer = ListActivityDeserializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        logs = self.list_activity.execute(get_actor(request), serializer.create_query(organization_id))
        return Response(
            [
                {
                    "id": log.id,
                    "organization_id": log.organization_id,
                    "actor_id": log.actor_id,
                    "entity_type": log.entity_type.value,
                    "entity_id": log.entity_id,
                    "action": log.action.value,
                    "changes": {field: [old, new] for field, (old, new) in log.changes.items()},
                    "created_at": log.created_at,
                }
                for log in logs
            ]
        )
