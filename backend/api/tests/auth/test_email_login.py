from io import StringIO

import pytest
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db import IntegrityError
from django.test import Client
from rest_framework.test import APIClient

from api.serializers import AdminUserCreateSerializer

User = get_user_model()

EMAIL = "jan@example.com"
PASSWORD = "S3cure-pass-123"


@pytest.fixture
def jan(db):
    return User.objects.create_user(email=EMAIL, password=PASSWORD)


@pytest.fixture
def admin_client(db):
    root = User.objects.create_superuser(email="root@example.com", password=PASSWORD)
    client = Client()
    client.force_login(root)
    return client


# ---------- model ----------


def test_user_model_is_custom_user_stored_in_user_table():
    assert settings.AUTH_USER_MODEL == "api.User"
    assert User._meta.db_table == "user"
    assert User.USERNAME_FIELD == "email"
    assert "username" not in {f.name for f in User._meta.get_fields()}


@pytest.mark.django_db
def test_create_user_when_email_given_then_email_is_login_stored_in_lowercase():
    user = User.objects.create_user(email=" Jan@EXAMPLE.com ", password=PASSWORD)

    assert user.email == EMAIL
    assert user.get_username() == EMAIL
    assert user.check_password(PASSWORD)
    assert not user.is_staff
    assert not user.is_superuser


@pytest.mark.django_db
def test_user_save_when_email_has_capitals_then_it_is_lowercased():
    user = User(email="Anna.Nowak@Example.PL")
    user.set_password(PASSWORD)
    user.save()

    user.refresh_from_db()
    assert user.email == "anna.nowak@example.pl"


def test_create_user_when_email_differs_only_in_case_then_integrity_error(jan):
    with pytest.raises(IntegrityError):
        User.objects.create_user(email="JAN@Example.com", password=PASSWORD)


def test_database_rejects_email_with_capitals_written_around_the_model(jan):
    with pytest.raises(IntegrityError):
        User.objects.filter(pk=jan.pk).update(email="JAN@example.com")


def test_get_by_natural_key_ignores_letter_case(jan):
    assert User.objects.get_by_natural_key("JAN@EXAMPLE.COM") == jan


@pytest.mark.django_db
def test_create_user_when_email_missing_then_value_error():
    with pytest.raises(ValueError):
        User.objects.create_user(email="", password=PASSWORD)


@pytest.mark.django_db
def test_create_superuser_sets_staff_and_superuser_flags():
    user = User.objects.create_superuser(email="root@example.com", password=PASSWORD)

    assert user.is_staff
    assert user.is_superuser


@pytest.mark.django_db
def test_create_user_when_email_taken_then_integrity_error(jan):
    with pytest.raises(IntegrityError):
        User.objects.create_user(email=EMAIL, password=PASSWORD)


# ---------- API ----------


def test_api_login_when_valid_email_and_password_then_session_is_started(jan):
    client = APIClient()

    response = client.post(
        "/api/auth/login/", {"email": EMAIL, "password": PASSWORD}, format="json"
    )

    assert response.status_code == 200
    assert response.data["email"] == EMAIL
    assert "username" not in response.data

    me = client.get("/api/auth/me/")
    assert me.status_code == 200
    assert me.data["id"] == jan.id
    assert me.data["email"] == EMAIL
    assert "username" not in me.data


def test_api_login_when_email_has_different_letter_case_then_200(jan):
    response = APIClient().post(
        "/api/auth/login/", {"email": "Jan@EXAMPLE.com", "password": PASSWORD}, format="json"
    )

    assert response.status_code == 200
    assert response.data["id"] == jan.id


def test_api_user_serializer_when_email_taken_in_different_case_then_invalid(jan):
    serializer = AdminUserCreateSerializer(data={"email": "JAN@example.COM", "password": PASSWORD})

    assert not serializer.is_valid()
    assert "email" in serializer.errors


@pytest.mark.django_db
def test_api_user_serializer_lowercases_new_email():
    serializer = AdminUserCreateSerializer(data={"email": "Nowy@Example.com", "password": PASSWORD})

    assert serializer.is_valid(), serializer.errors
    assert serializer.validated_data["email"] == "nowy@example.com"


def test_api_login_when_wrong_password_then_400(jan):
    response = APIClient().post(
        "/api/auth/login/", {"email": EMAIL, "password": "wrong-password"}, format="json"
    )

    assert response.status_code == 400


def test_api_login_when_username_sent_instead_of_email_then_400(jan):
    response = APIClient().post(
        "/api/auth/login/", {"username": EMAIL, "password": PASSWORD}, format="json"
    )

    assert response.status_code == 400
    assert response.data["detail"] == "Email and password required"


# ---------- admin ----------


def test_admin_login_with_email_then_user_list_is_available(jan):
    jan.is_staff = True
    jan.is_superuser = True
    jan.save()
    client = Client()

    response = client.post("/admin/login/", {"username": "JAN@example.com", "password": PASSWORD})

    assert response.status_code == 302
    changelist = client.get("/admin/api/user/")
    assert changelist.status_code == 200
    assert EMAIL in changelist.content.decode()


def test_admin_add_user_with_email_and_password(admin_client):
    assert admin_client.get("/admin/api/user/add/").status_code == 200

    response = admin_client.post(
        "/admin/api/user/add/",
        {
            "email": "Nowy@Example.com",
            "usable_password": "true",
            "password1": PASSWORD,
            "password2": PASSWORD,
        },
    )

    assert response.status_code == 302
    assert User.objects.get(email="nowy@example.com").check_password(PASSWORD)


def test_admin_add_user_when_email_taken_in_different_case_then_form_error(admin_client, jan):
    response = admin_client.post(
        "/admin/api/user/add/",
        {
            "email": "JAN@example.com",
            "usable_password": "true",
            "password1": PASSWORD,
            "password2": PASSWORD,
        },
    )

    assert response.status_code == 200
    assert "email" in response.context["adminform"].form.errors
    assert User.objects.filter(email=EMAIL).count() == 1


def test_admin_user_change_page_renders(admin_client, jan):
    assert admin_client.get(f"/admin/api/user/{jan.pk}/change/").status_code == 200


# ---------- management commands ----------


@pytest.mark.django_db
def test_createsuperuser_noinput_with_email(monkeypatch):
    monkeypatch.setenv("DJANGO_SUPERUSER_PASSWORD", PASSWORD)

    call_command("createsuperuser", interactive=False, email="boss@example.com", stdout=StringIO())

    boss = User.objects.get(email="boss@example.com")
    assert boss.is_superuser
    assert boss.check_password(PASSWORD)


@pytest.mark.django_db
def test_create_default_super_user_creates_then_syncs_password(monkeypatch):
    monkeypatch.setenv("DJANGO_SUPERUSER_EMAIL", "Admin@Example.com")
    monkeypatch.setenv("DJANGO_SUPERUSER_PASSWORD", PASSWORD)
    call_command("create_default_super_user")

    monkeypatch.setenv("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
    monkeypatch.setenv("DJANGO_SUPERUSER_PASSWORD", "Another-pass-456")
    call_command("create_default_super_user")

    admin = User.objects.get(email="admin@example.com")
    assert admin.is_superuser
    assert admin.check_password("Another-pass-456")
