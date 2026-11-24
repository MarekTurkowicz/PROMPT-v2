from django.urls import path

from app.access.adapter.inbound.django.access_views import (
    CsrfView,
    LoginView,
    LogoutView,
    MeView,
)

urlpatterns = [
    path("csrf/", CsrfView.as_view(), name="access-csrf"),
    path("login/", LoginView.as_view(), name="access-login"),
    path("logout/", LogoutView.as_view(), name="access-logout"),
    path("me/", MeView.as_view(), name="access-me"),
]
