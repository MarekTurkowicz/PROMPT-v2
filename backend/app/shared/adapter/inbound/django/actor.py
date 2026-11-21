from rest_framework.exceptions import NotAuthenticated
from rest_framework.request import Request

from app.shared.core.ports.api.actor import Actor


def get_actor(request: Request) -> Actor:
    user = request.user
    if not user.is_authenticated:
        raise NotAuthenticated()
    return Actor(user_id=user.pk, is_superuser=user.is_superuser)
