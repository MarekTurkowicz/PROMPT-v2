from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import NotAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

# ─────────────────────────────
# Health + Me
# ─────────────────────────────


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def health(request: Request) -> Response:
    return Response({"status": "ok"})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def me(request: Request) -> Response:
    user = request.user
    if not user.is_authenticated:
        raise NotAuthenticated()
    return Response(
        {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_staff": user.is_staff,
        }
    )


# ─────────────────────────────
# Auth (sesje + CSRF)
# ─────────────────────────────


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
@ensure_csrf_cookie
def auth_csrf(request: Request) -> Response:
    return Response({"detail": "CSRF cookie set"})


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
@csrf_protect
def auth_login(request: Request) -> Response:
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"detail": "Email and password required"}, status=400)

    user = authenticate(request, email=email, password=password)
    if not user:
        return Response({"detail": "Invalid credentials"}, status=400)

    login(request, user)
    return Response(
        {
            "id": user.id,
            "email": user.email,
            "is_staff": user.is_staff,
        },
        status=200,
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@csrf_protect
def auth_logout(request: Request) -> Response:
    logout(request)
    return Response(status=204)
