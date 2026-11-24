from collections.abc import Callable, Iterator
from decimal import Decimal

import psycopg2
import pytest
from django.conf import settings
from psycopg2.extensions import connection, cursor

from app.access.core.domain.value_objects.email import Email
from app.finance.core.domain.value_objects.due_days import DueDays
from app.object_relational_schema import MIGRATIONS, SCHEMA_OBJECTS
from app.project.core.domain.value_objects.color import Color
from app.shared.adapter.outbound.object_relational_db.migrate import apply_migrations, connect
from app.shared.adapter.outbound.object_relational_db.objects import EnumType
from app.shared.core.domain.exceptions import InvalidValueError
from app.shared.core.domain.value_objects.money import Currency
from app.shared.core.domain.value_objects.position import Position
from app.task.core.domain.value_objects.comment_content import CommentContent
from app.task.core.domain.value_objects.estimated_hours import EstimatedHours
from app.task.core.domain.value_objects.file_size import FileSize
from app.task.core.domain.value_objects.hours import Hours
from app.task.core.domain.value_objects.priority import Priority

# The tests use their own database, so the data in the configured one is never touched.
TEST_DB = settings.OBJECT_RELATIONAL_DB["NAME"] + "_test"

SEED = """
INSERT INTO "user" (id, password, email, first_name, last_name, is_active, is_staff, is_superuser,
                    date_joined)
    VALUES (1, 'x', 'jan@x.pl', 'Jan', 'Kowalski', true, false, false, now());
INSERT INTO organization (id, name, is_active, settings, created_at, modified_at)
    VALUES (1, 'Org', true, '{}', now(), now());
INSERT INTO organization_member (id, organization_id, user_id, status) VALUES (1, 1, 1, 'active');
INSERT INTO member_group (id, organization_id, name, created_at) VALUES (1, 1, 'Team', now());
INSERT INTO role (id, organization_id, name, permissions) VALUES (1, 1, 'Admin', '{project.view}');
INSERT INTO project (id, organization_id, owner_id, name, description, status, hidden_status_ids,
                     created_at, updated_at)
    VALUES (1, 1, 1, 'P1', '', 'active', '{}', now(), now()),
           (2, 1, 1, 'P2', '', 'active', '{}', now(), now());
INSERT INTO task_status (id, organization_id, project_id, category, name, color, position, is_default,
                         is_active)
    VALUES (1, 1, NULL, 'todo', 'To do', '#94a3b8', 0, true, true);
INSERT INTO funding (id, organization_id, type, name, funder, program, agreement_number, amount_total,
                     description, created_at)
    VALUES (1, 1, 'grant', 'F1', '', '', '', ROW(1000, 'PLN'), '', now()),
           (2, 1, 'grant', 'F2', '', '', '', ROW(500, 'EUR'), '', now());
INSERT INTO project_funding (id, project_id, funding_id, is_primary, note, created_at)
    VALUES (1, 1, 1, true, '', now()), (2, 2, 2, true, '', now());
INSERT INTO task (id, project_id, status_id, title, description, priority, checklist, attachments,
                  created_at, updated_at)
    VALUES (1, 1, 1, 'T1', '', 3, '{}', '{}', now(), now());
INSERT INTO task_assignment (id, task_id, assigned_to_id, assigned_at) VALUES (1, 1, 1, now());
INSERT INTO activity_log (id, organization_id, entity_type, entity_id, action, changes, created_at)
    VALUES (1, 1, 'task', 1, 'created', '{}', now());
INSERT INTO notification (id, activity_id, recipient_id, content, created_at)
    VALUES (1, 1, 1, '{"title": "T1"}', now());
"""


@pytest.fixture(scope="module")
def db() -> Iterator[connection]:
    # Needs the prompt_ordb container (or OR_DB_*); like the MongoDB tests, no skip without a database.
    admin = connect("postgres")
    admin.autocommit = True
    with admin.cursor() as cur:
        cur.execute(f"DROP DATABASE IF EXISTS {TEST_DB} WITH (FORCE)")
        cur.execute(f"CREATE DATABASE {TEST_DB}")
    conn = connect(TEST_DB)
    assert apply_migrations(conn, MIGRATIONS) == [1]
    yield conn
    conn.close()
    with admin.cursor() as cur:
        cur.execute(f"DROP DATABASE {TEST_DB} WITH (FORCE)")
    admin.close()


@pytest.fixture
def cur(db: connection) -> Iterator[cursor]:
    with db.cursor() as c:
        c.execute(SEED)
        yield c
    db.rollback()


def rejects(cur: cursor, sql: str, params: tuple[object, ...] | None = None) -> bool:
    cur.execute("SAVEPOINT s")
    try:
        cur.execute(sql, params)
    except psycopg2.Error:
        cur.execute("ROLLBACK TO SAVEPOINT s")
        return True
    cur.execute("RELEASE SAVEPOINT s")
    return False


@pytest.mark.parametrize(
    ("factory", "pg_domain", "value"),
    [
        *((Priority, "priority_d", v) for v in (0, 1, 5, 6)),
        *((Position, "position_d", v) for v in (-1, 0)),
        *((DueDays, "due_days_d", v) for v in (-1, 0)),
        *((EstimatedHours, "est_hours_d", Decimal(v)) for v in ("0", "0.01", "-1", "NaN")),
        *((Hours, "hours_d", Decimal(v)) for v in ("0", "0.01", "-1", "NaN")),
        *((FileSize, "file_size_d", v) for v in (0, 1)),
        *((Currency, "currency_d", v) for v in ("PLN", "pln", "PL", "PLNX")),
        *((Color, "color_d", v) for v in ("#a1B2c3", "#12345", "#1234567", "red")),
        *((CommentContent, "nonempty_text_d", v) for v in ("", "x")),
    ],
)
def test_domain_value_object_and_pg_domain_agree(
    cur: cursor, factory: Callable[[object], object], pg_domain: str, value: object
) -> None:
    try:
        factory(value)
        domain_accepts = True
    except InvalidValueError:
        domain_accepts = False
    # CAST, not ::, because -1::position_d is parsed as -(1::position_d).
    assert domain_accepts == (not rejects(cur, f"SELECT CAST(%s AS {pg_domain})", (value,)))


def test_email_value_object_writes_what_login_email_accepts(cur: cursor) -> None:
    assert not rejects(cur, "SELECT CAST(%s AS login_email_d)", (Email("Jan@X.pl").value,))


def test_second_run_applies_nothing(db: connection) -> None:
    assert apply_migrations(db, MIGRATIONS) == []


@pytest.mark.parametrize("enum", [o for o in SCHEMA_OBJECTS if isinstance(o, EnumType)], ids=lambda e: e.name)
def test_pg_enum_order_matches_schema(cur: cursor, enum: EnumType) -> None:
    cur.execute(
        "SELECT array_agg(enumlabel ORDER BY enumsortorder) FROM pg_enum WHERE enumtypid = %s::regtype",
        (enum.name,),
    )
    row = cur.fetchone()
    assert row is not None
    assert tuple(row[0]) == enum.values


DOMAIN_CASES = [
    ("login_email_d", "'jan@firma.pl'", "'Jan@Firma.pl'"),
    ("position_d", "0", "(-1)"),
    ("priority_d", "5", "6"),
    ("est_hours_d", "0.5", "0"),
    ("hours_d", "8", "0"),
    ("due_days_d", "0", "(-1)"),
    ("color_d", "'#94a3B8'", "'red'"),
    ("currency_d", "'PLN'", "'pln'"),
    ("file_size_d", "52428801", "0"),
    ("nonempty_text_d", "'x'", "''"),
]


@pytest.mark.parametrize(("domain", "valid", "invalid"), DOMAIN_CASES, ids=[c[0] for c in DOMAIN_CASES])
def test_domain_accepts_valid_and_rejects_invalid(cur: cursor, domain: str, valid: str, invalid: str) -> None:
    assert not rejects(cur, f"SELECT {valid}::{domain}")
    assert rejects(cur, f"SELECT {invalid}::{domain}")


@pytest.mark.parametrize("value", ["'NaN'::est_hours_d", "'NaN'::hours_d", "ROW('NaN', 'PLN')::money_d"])
def test_numeric_domains_reject_nan(cur: cursor, value: str) -> None:
    assert rejects(cur, f"SELECT {value}")


def test_currency_is_not_truncated_by_a_cast(cur: cursor) -> None:
    assert rejects(cur, "SELECT 'PLNX'::currency_d")


@pytest.mark.parametrize(
    "sql",
    [
        "UPDATE role SET name = repeat('a', 1000) WHERE id = 1",
        "UPDATE organization_member SET phone = repeat('1', 100) WHERE id = 1",
        "UPDATE task SET attachments = ARRAY[ROW(1, 'f', 'a.pdf', 'application/pdf', 52428801, 1, now())]"
        "::attachment_d[] WHERE id = 1",
    ],
)
def test_length_and_size_limits_are_left_to_the_domain(cur: cursor, sql: str) -> None:
    assert not rejects(cur, sql)


CHECKLIST_ITEM = "ROW(1, NULL, 'Item', 0, {done_by}, {done_at}, now(), now())::checklist_item_d"
ATTACHMENT = "ROW(1, 'f/a.pdf', 'a.pdf', 'application/pdf', {size}, 1, now())::attachment_d"


@pytest.mark.parametrize(
    "value",
    [
        "ROW(10, NULL)::money_d",
        "ROW(NULL, 'PLN')::money_d",
        "ROW(0, 'PLN')::money_d",
        CHECKLIST_ITEM.format(done_by="1", done_at="NULL"),
        CHECKLIST_ITEM.format(done_by="NULL", done_at="now()"),
        ATTACHMENT.format(size="0"),
        ATTACHMENT.format(size="NULL"),
        "ROW(1, NULL, 'a.pdf', 'application/pdf', 10, 1, now())::attachment_d",
    ],
)
def test_composite_values_reject_nulls_and_ranges(cur: cursor, value: str) -> None:
    assert rejects(cur, f"SELECT {value}")


def test_composite_values_accept_valid(cur: cursor) -> None:
    for value in (
        "ROW(10.5, 'PLN')::money_d",
        CHECKLIST_ITEM.format(done_by="NULL", done_at="NULL"),
        CHECKLIST_ITEM.format(done_by="1", done_at="now()"),
        ATTACHMENT.format(size="1"),
    ):
        assert not rejects(cur, f"SELECT {value}")


def test_array_element_ids_must_be_unique(cur: cursor) -> None:
    item = "ROW({id}, NULL, 'Item', 0, NULL, NULL, now(), now())"
    sql = "UPDATE task SET checklist = ARRAY[{a}, {b}]::checklist_item_d[] WHERE id = 1"
    assert rejects(cur, sql.format(a=item.format(id=1), b=item.format(id=1)))
    assert not rejects(cur, sql.format(a=item.format(id=1), b=item.format(id=2)))
    file = "ROW({id}, 'f', 'a.pdf', 'application/pdf', 10, 1, now())"
    sql = "UPDATE task SET attachments = ARRAY[{a}, {b}]::attachment_d[] WHERE id = 1"
    assert rejects(cur, sql.format(a=file.format(id=7), b=file.format(id=7)))


def test_project_funding_unique_only_among_active_links(cur: cursor) -> None:
    assert rejects(
        cur,
        "INSERT INTO project_funding (project_id, funding_id, is_primary, note, created_at) "
        "VALUES (1, 2, true, '', now())",
    )
    assert rejects(
        cur,
        "INSERT INTO project_funding (project_id, funding_id, is_primary, note, created_at) "
        "VALUES (1, 1, false, '', now())",
    )
    cur.execute("UPDATE project_funding SET detached_at = now() WHERE id = 1")
    assert not rejects(
        cur,
        "INSERT INTO project_funding (project_id, funding_id, is_primary, note, created_at) "
        "VALUES (1, 1, true, '', now())",
    )


STATUS = (
    "INSERT INTO task_status (organization_id, project_id, category, name, color, position, "
    "is_default, is_active) VALUES (1, {project}, 'todo', '{name}', '#000000', 0, true, true)"
)


def test_one_default_status_per_organization_but_projects_may_have_their_own(cur: cursor) -> None:
    assert rejects(cur, STATUS.format(project="NULL", name="Second"))
    assert not rejects(cur, STATUS.format(project="1", name="Project default"))


def test_status_name_unique_for_the_whole_organization(cur: cursor) -> None:
    assert rejects(cur, STATUS.format(project="NULL", name="To do").replace("true, true", "false, true"))


@pytest.mark.parametrize(
    "sql",
    [
        "UPDATE project SET start_date = '2026-02-01', end_date = '2026-01-01' WHERE id = 1",
        "UPDATE funding SET start_date = '2026-02-01', end_date = '2026-01-01' WHERE id = 1",
        "UPDATE project_funding SET allocation_start = '2026-02-01', allocation_end = '2026-01-01' "
        "WHERE id = 1",
        "UPDATE task SET start_date = '2026-02-01', due_date = '2026-01-01' WHERE id = 1",
        "UPDATE task_assignment SET started_at = now(), finished_at = now() - interval '1 hour' WHERE id = 1",
        "INSERT INTO time_entry (assignment_id, hours, started_at, finished_at, created_at, updated_at) "
        "VALUES (1, 1, '2026-01-01 10:00', '2026-01-01 10:00', now(), now())",
        "INSERT INTO role_assignment (role_id, member_id, group_id, created_at, updated_at) "
        "VALUES (1, 1, 1, now(), now())",
        "INSERT INTO role_assignment (role_id, member_id, group_id, created_at, updated_at) "
        "VALUES (1, NULL, NULL, now(), now())",
        "INSERT INTO comment (task_id, project_id, author_id, content, attachments, created_at, updated_at) "
        "VALUES (1, 1, 1, 'x', '{}', now(), now())",
        "INSERT INTO comment (task_id, author_id, content, attachments, created_at, updated_at) "
        "VALUES (1, 1, '', '{}', now(), now())",
        "INSERT INTO expense (project_id, project_funding_id, type, amount, spent_on_date, description, "
        "attachments, created_by_id, created_at) VALUES (1, 1, 'travel', ROW(10, 'PLN'), '2026-01-01', '', "
        "'{}', 1, now())",
        "INSERT INTO organization_member (organization_id, user_id, status) VALUES (1, 1, 'invited')",
        "INSERT INTO organization_member (organization_id, user_id, status) VALUES (1, 1, 'unknown')",
    ],
)
def test_table_checks_reject_invalid_rows(cur: cursor, sql: str) -> None:
    assert rejects(cur, sql)


def test_role_assignment_nulls_not_distinct(cur: cursor) -> None:
    sql = (
        "INSERT INTO role_assignment (role_id, member_id, created_at, updated_at) VALUES (1, 1, now(), now())"
    )
    assert not rejects(cur, sql)
    assert rejects(cur, sql)


OLD_ACTIVITY = """
INSERT INTO activity_log (id, organization_id, entity_type, entity_id, action, changes, created_at)
    VALUES (2, 1, 'task', 1, 'updated', '{}', now() - interval '6 months 1 day');
INSERT INTO notification (id, activity_id, recipient_id, content, created_at)
    VALUES (2, 2, 1, '{"title": "T1"}', now());
"""


def test_activity_log_cannot_be_updated_or_truncated(cur: cursor) -> None:
    cur.execute(OLD_ACTIVITY)
    assert rejects(cur, "UPDATE activity_log SET changes = '{\"x\": 1}' WHERE id = 2")
    cur.execute("DELETE FROM notification")
    assert rejects(cur, "TRUNCATE activity_log")


def test_activity_log_keeps_entries_younger_than_six_months(cur: cursor) -> None:
    cur.execute(
        "INSERT INTO activity_log (id, organization_id, entity_type, entity_id, action, changes, created_at) "
        "VALUES (3, 1, 'task', 1, 'updated', '{}', now() - interval '6 months' + interval '1 day')"
    )
    assert rejects(cur, "DELETE FROM activity_log WHERE id = 3")


def test_retention_deletes_entries_older_than_six_months(cur: cursor) -> None:
    cur.execute(OLD_ACTIVITY)
    cur.execute("DELETE FROM activity_log WHERE created_at < now() - interval '6 months'")
    cur.execute("SELECT id FROM activity_log")
    assert cur.fetchall() == [(1,)]


def test_retention_deletes_notifications_like_relational(cur: cursor) -> None:
    cur.execute(OLD_ACTIVITY)
    cur.execute("DELETE FROM activity_log WHERE id = 2")
    cur.execute("SELECT id FROM notification")
    assert cur.fetchall() == [(1,)]


@pytest.mark.parametrize(
    "sql",
    [
        "UPDATE organization SET settings = '[]' WHERE id = 1",
        "UPDATE role SET permissions = '{anything, anything}' WHERE id = 1",
        "UPDATE notification SET content = NULL WHERE id = 1",
        "UPDATE organization_member SET email = 'not-an-email' WHERE id = 1",
        "UPDATE \"user\" SET email = 'admin@localhost' WHERE id = 1",
        "UPDATE task SET project_funding_id = 2 WHERE id = 1",
    ],
)
def test_not_stricter_than_relational(cur: cursor, sql: str) -> None:
    # The relational database accepts these rows, so switching databases must not lose them.
    assert not rejects(cur, sql)
