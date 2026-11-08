import pytest
from django.contrib.auth import get_user_model
from django.test import Client


@pytest.mark.django_db
def test_time_entry_admin_changelist_search_renders():
    user_model = get_user_model()
    root = user_model.objects.create_superuser(email="root@example.com", password="S3cure-pass-123")
    client = Client()
    client.force_login(root)

    response = client.get("/admin/api/timeentry/", {"q": "member@example.com"})

    assert response.status_code == 200
