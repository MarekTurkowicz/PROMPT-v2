from django.urls import path

from app.oganization.adapter.inbound.django.organization_settings_view import (
    OrganizationSettingsView,
)
from app.oganization.adapter.inbound.django.organization_view import OrganizationView

urlpatterns = [
    path("organizations/", OrganizationView.as_view(), name="create-organization"),
    path(
        "organizations/<int:organization_id>/settings/",
        OrganizationSettingsView.as_view(),
        name="update-organization-settings",
    ),
]
