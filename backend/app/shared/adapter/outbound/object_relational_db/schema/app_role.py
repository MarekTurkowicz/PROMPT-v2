from app.shared.adapter.outbound.object_relational_db.schema.objects import Statement

# The application logs in as a member of promt_or_app, the schema owner only migrates and runs retention.
# Without UPDATE and DELETE on activity_log the retention flag gives the application nothing.
APP_ROLE = Statement(
    name="promt_or_app",
    depends_on=("activity_log", "notification"),
    sql="""
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'promt_or_app') THEN
        CREATE ROLE promt_or_app NOLOGIN;
    END IF;
END $$;
GRANT USAGE ON SCHEMA public TO promt_or_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO promt_or_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO promt_or_app;
REVOKE UPDATE, DELETE ON activity_log FROM promt_or_app;
REVOKE INSERT, UPDATE, DELETE ON schema_version FROM promt_or_app
""",
)
