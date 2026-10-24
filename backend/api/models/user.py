from typing import Any, ClassVar

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.db.models.functions import Lower


class UserManager(BaseUserManager["User"]):
    """
    Manager for a user model where the email is the login (no username).
    Emails are case-insensitive: they are stored and looked up in lowercase.
    """

    use_in_migrations = True

    @classmethod
    def normalize_email(cls, email: str | None) -> str:
        return super().normalize_email(email).strip().lower()

    def get_by_natural_key(self, username: str | None) -> "User":
        # used by authenticate(), the admin login and createsuperuser
        return self.get(email=self.normalize_email(username))

    def _create_user(self, email: str, password: str | None, **extra_fields: Any) -> "User":
        if not email:
            raise ValueError("The email must be set.")
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields: Any) -> "User":
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(
        self, email: str, password: str | None = None, **extra_fields: Any
    ) -> "User":
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields["is_staff"] is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields["is_superuser"] is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    One account per person, regardless of how many organizations they belong to.
    The email is the login; organization-specific data lives in OrganizationMember.
    """

    username = None  # type: ignore[assignment]
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    objects: ClassVar[UserManager] = UserManager()  # type: ignore[assignment]

    class Meta:
        db_table = "user"
        constraints = [
            # Jan@x.pl and jan@x.pl are the same login, so only the lowercase form is stored
            models.CheckConstraint(
                condition=models.Q(email=Lower("email")), name="user_email_lowercase"
            ),
        ]

    def __str__(self) -> str:
        return self.email

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.email = User.objects.normalize_email(self.email)
        super().save(*args, **kwargs)
