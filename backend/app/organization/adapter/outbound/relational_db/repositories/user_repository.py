from django.contrib.auth import get_user_model

from app.organization.core.ports.spi.db.repositories.user_port import UserPort


class UserRepository(UserPort):
    def exists_by_id(self, user_id: int) -> bool:
        # TODO do sprawdzenia jeszcze
        return get_user_model().objects.filter(pk=user_id).exists()
