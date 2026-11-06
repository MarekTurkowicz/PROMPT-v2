from django.db import models
from django.db.models import Q


class Comment(models.Model):
    """
    Represents a comment on a task or on a project (exactly one of the two); replies point
    to their parent comment.
    """

    task = models.ForeignKey(
        "api.Task",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="comments",
        db_index=False,
    )
    project = models.ForeignKey(
        "api.Project",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="comments",
        db_index=False,
    )
    author = models.ForeignKey(
        "api.OrganizationMember",
        on_delete=models.PROTECT,
        related_name="comments",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )

    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "comment"
        ordering = ["created_at", "id"]
        constraints = [
            models.CheckConstraint(
                condition=(
                    Q(task__isnull=False, project__isnull=True)
                    | Q(task__isnull=True, project__isnull=False)
                ),
                name="comment_one_of_task_project",
            ),
            models.CheckConstraint(condition=~Q(content=""), name="comment_content_not_empty"),
        ]
        indexes = [
            models.Index(fields=["task", "created_at"], name="comment_task_ix"),
            models.Index(fields=["project", "created_at"], name="comment_project_ix"),
        ]

    def __str__(self) -> str:
        return f"Comment by {self.author}"
