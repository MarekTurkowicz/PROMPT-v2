from django.db import models


class MemberGroupMember(models.Model):
    """
    Represents an organization member's membership in a group.
    """

    pk = models.CompositePrimaryKey("group_id", "member_id")
    group = models.ForeignKey(
        "api.MemberGroup",
        on_delete=models.CASCADE,
        related_name="group_members",
        db_index=False,
    )
    member = models.ForeignKey(
        "api.OrganizationMember",
        on_delete=models.CASCADE,
        related_name="group_memberships",
    )

    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "member_group_member"

    def __str__(self) -> str:
        return f"{self.member} in {self.group}"
