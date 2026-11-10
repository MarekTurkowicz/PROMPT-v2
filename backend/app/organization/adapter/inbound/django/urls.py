from django.urls import path

from app.organization.adapter.inbound.django.container import get_container
from app.organization.adapter.inbound.django.organization_settings_view import (
    OrganizationSettingsView,
)
from app.organization.adapter.inbound.django.organization_view import OrganizationView

container = get_container()

urlpatterns = [
    path(
        "organizations/",
        OrganizationView.as_view(create_organization=container.create_organization),
        name="create-organization",
    ),
    path(
        "organizations/<int:organization_id>/settings/",
        OrganizationSettingsView.as_view(
            update_organization_settings=container.update_organization_settings,
        ),
        name="update-organization-settings",
    ),
]
