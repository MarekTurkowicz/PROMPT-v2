from django.db import models


class MemberGroupMember(models.Model):
    """
    Represents an organization member's membership in a group.
    """

    pk = models.CompositePrimaryKey("group_id", "member_id")
    group = models.ForeignKey(
        "app.MemberGroup",
        on_delete=models.CASCADE,
        related_name="group_members",
        db_index=False,
    )
    member = models.ForeignKey(
        "app.OrganizationMember",
        on_delete=models.CASCADE,
        related_name="group_memberships",
    )

    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "app"
        db_table = "member_group_member"

    def __str__(self) -> str:
        return f"{self.member} in {self.group}"
