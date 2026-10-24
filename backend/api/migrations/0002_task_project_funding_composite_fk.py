from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE task
                ADD CONSTRAINT task_project_funding_same_project
                FOREIGN KEY (project_funding_id, project_id)
                REFERENCES project_funding (id, project_id)
                DEFERRABLE INITIALLY DEFERRED;
            """,
            reverse_sql="ALTER TABLE task DROP CONSTRAINT task_project_funding_same_project;",
        ),
    ]
