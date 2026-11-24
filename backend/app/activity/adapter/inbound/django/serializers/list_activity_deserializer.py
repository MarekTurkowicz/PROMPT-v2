from typing import Any

from rest_framework import serializers

from app.activity.core.domain.enums.activity_action import ActivityAction
from app.activity.core.domain.enums.entity_type import EntityType
from app.activity.core.ports.api.queries.list_activity_query import ListActivityQuery
from app.shared.adapter.inbound.django.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE


class ListActivityDeserializer(serializers.Serializer[ListActivityQuery]):
    actor_id = serializers.IntegerField(min_value=1, required=False)
    entity_types = serializers.MultipleChoiceField(
        choices=[entity_type.value for entity_type in EntityType], required=False
    )
    actions = serializers.MultipleChoiceField(
        choices=[action.value for action in ActivityAction], required=False
    )
    entity_id = serializers.IntegerField(min_value=1, required=False)
    created_from = serializers.DateTimeField(required=False)
    created_to = serializers.DateTimeField(required=False)
    limit = serializers.IntegerField(min_value=1, max_value=MAX_PAGE_SIZE, default=DEFAULT_PAGE_SIZE)
    offset = serializers.IntegerField(min_value=0, default=0)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if "entity_id" in attrs and len(attrs.get("entity_types", ())) != 1:
            raise serializers.ValidationError({"entity_id": "Needs exactly one entity type."})
        if "created_from" in attrs and "created_to" in attrs and attrs["created_from"] >= attrs["created_to"]:
            raise serializers.ValidationError({"created_to": "Must be later than created_from."})
        return attrs

    def create_query(self, organization_id: int) -> ListActivityQuery:
        data = self.validated_data
        return ListActivityQuery(
            organization_id=organization_id,
            actor_id=data.get("actor_id"),
            entity_types=frozenset(EntityType(value) for value in data.get("entity_types", ())),
            actions=frozenset(ActivityAction(value) for value in data.get("actions", ())),
            entity_id=data.get("entity_id"),
            created_from=data.get("created_from"),
            created_to=data.get("created_to"),
            limit=data["limit"],
            offset=data["offset"],
        )
