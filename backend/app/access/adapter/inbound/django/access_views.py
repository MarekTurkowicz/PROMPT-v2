from typing import Any

from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.exceptions import NotAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from app.access.adapter.inbound.django.serializers.login_deserializer import (
    LoginDeserializer,
)
from app.access.adapter.outbound.relational_db.models.user import User
from app.access.core.domain.exceptions import InvalidCredentialsError


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request: Request, *args: object, **kwargs: object) -> Response:
        return Response({"detail": "CSRF cookie set"}, status=status.HTTP_200_OK)


# APIView is csrf_exempt and SessionAuthentication checks CSRF only for logged-in users.
@method_decorator(csrf_protect, name="dispatch")
class LoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request: Request, *args: object, **kwargs: object) -> Response:
        serializer = LoginDeserializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # ModelBackend returns None for a wrong password and for is_active=False, so both get the same error.
        user = authenticate(
            request._request,
            email=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )
        if not isinstance(user, User):
            raise InvalidCredentialsError()
        login(request._request, user)
        return Response(_user_payload(user), status=status.HTTP_200_OK)


class LogoutView(APIView):
    def post(self, request: Request, *args: object, **kwargs: object) -> Response:
        logout(request._request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    def get(self, request: Request, *args: object, **kwargs: object) -> Response:
        user = request.user
        if not isinstance(user, User):
            raise NotAuthenticated()
        return Response(_user_payload(user), status=status.HTTP_200_OK)


def _user_payload(user: User) -> dict[str, Any]:
    return {
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_staff": user.is_staff,
    }
