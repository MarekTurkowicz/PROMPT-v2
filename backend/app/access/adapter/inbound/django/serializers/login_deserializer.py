from typing import Any

from rest_framework import serializers


class LoginDeserializer(serializers.Serializer[dict[str, Any]]):
    email = serializers.EmailField()
    password = serializers.CharField(trim_whitespace=False)
