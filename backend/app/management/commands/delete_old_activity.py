from datetime import UTC, datetime
from typing import Any

from django.core.management.base import BaseCommand

from app.shared.adapter.inbound.django.container import get_container


class Command(BaseCommand):
    help = "Delete activity log entries older than the retention period"

    def handle(self, *args: Any, **options: Any) -> None:
        deleted = get_container().activity_retention.delete_expired(datetime.now(UTC))
        self.stdout.write(f"Deleted {deleted} activity log entries")
