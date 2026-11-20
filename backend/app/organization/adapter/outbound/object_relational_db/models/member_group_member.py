from app.shared.adapter.outbound.object_relational_db.objects import Table

MEMBER_GROUP_MEMBER = Table(
    name="member_group_member",
    depends_on=("member_group", "organization_member"),
    sql="""
CREATE TABLE member_group_member (
    group_id   bigint NOT NULL REFERENCES member_group (id) ON DELETE CASCADE,
    member_id  bigint NOT NULL REFERENCES organization_member (id) ON DELETE CASCADE,
    added_at   timestamptz NOT NULL,
    PRIMARY KEY (group_id, member_id)
)
""",
)
