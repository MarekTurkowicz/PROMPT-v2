from django.urls import path

from .views import auth_csrf, auth_login, auth_logout, health, me

urlpatterns = [
    path("health/", health, name="health"),
    path("auth/me/", me, name="auth_me"),
    path("auth/csrf/", auth_csrf, name="auth_csrf"),
    path("auth/login/", auth_login, name="auth_login"),
    path("auth/logout/", auth_logout, name="auth_logout"),
]
