from django.urls import path

from app.oganization.adapter.inbound.django.organization_view import OrganizationView

urlpatterns = [
    path("organizations/", OrganizationView.as_view(), name="create-organization"),
]
