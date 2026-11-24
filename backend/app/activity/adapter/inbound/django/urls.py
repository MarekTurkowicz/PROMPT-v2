from django.urls import path

from app.activity.adapter.inbound.django.activity_view import ActivityView
from app.shared.adapter.inbound.django.container import get_container

container = get_container()

urlpatterns = [
    path(
        "",
        ActivityView.as_view(list_activity=container.list_activity),
        name="list-activity",
    ),
]
