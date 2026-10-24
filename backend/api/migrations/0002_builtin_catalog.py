"""Seed built-in permissions, roles and statuses.

The catalog below is frozen on purpose: a migration must keep doing the same
thing even when the application's catalog changes later.
"""

from django.db import migrations

ORG, PROJECT = "organization", "project"

PERMISSIONS = [
    ("org.manage", "Edit organization settings", ORG),
    ("org.members.manage", "Add, block and change roles of organization members", ORG),
    ("org.teams.manage", "Create and edit organization teams", ORG),
    ("org.roles.manage", "Create and edit custom roles", ORG),
    ("org.audit.view", "View the organization audit log", ORG),
    ("project.create", "Create projects", ORG),
    ("funding.view", "View fundings", ORG),
    ("funding.manage", "Create and edit fundings and task templates", ORG),
    ("project.view", "View a project and its tasks", PROJECT),
    ("project.edit", "Edit project details", PROJECT),
    ("project.delete", "Delete or archive a project", PROJECT),
    ("project.members.manage", "Manage project members and project teams", PROJECT),
    ("project.audit.view", "View the project audit log", PROJECT),
    ("milestone.manage", "Create and edit milestones", PROJECT),
    ("task.create", "Create tasks", PROJECT),
    ("task.edit_own", "Edit tasks one created or is assigned to", PROJECT),
    ("task.edit_any", "Edit any task", PROJECT),
    ("task.assign", "Assign people to tasks", PROJECT),
    ("task.review", "Accept or reject reviewed tasks", PROJECT),
    ("task.delete", "Delete tasks", PROJECT),
    ("checklist.manage", "Create and edit checklists", PROJECT),
    ("checklist.check_own", "Tick off checklist items assigned to oneself", PROJECT),
    ("comment.create", "Write comments", PROJECT),
    ("comment.moderate", "Edit or delete other people's comments", PROJECT),
]

PROJECT_ALL = [code for code, _, scope in PERMISSIONS if scope == PROJECT]

ROLES = [
    ("org_admin", "Administrator organizacji", ORG, [code for code, _, _ in PERMISSIONS]),
    ("org_pm", "Project Manager", ORG, [
        "org.members.manage", "org.teams.manage", "project.create",
        "funding.view", "funding.manage",
    ]),
    ("org_member", "Pracownik", ORG, ["funding.view"]),
    ("org_viewer", "Obserwator", ORG, ["funding.view", "project.view"]),
    ("project_admin", "Administrator projektu", PROJECT, PROJECT_ALL),
    ("project_member", "Członek projektu", PROJECT, [
        "project.view", "task.create", "task.edit_own",
        "checklist.check_own", "comment.create",
    ]),
    ("project_viewer", "Obserwator projektu", PROJECT, ["project.view"]),
]

STATUSES = [
    # applies_to, code, name, category, color, is_default
    ("task", "todo", "Do zrobienia", "todo", "#8a97a6", True),
    ("task", "doing", "W trakcie", "in_progress", "#1c6aa8", False),
    ("task", "to_review", "Do sprawdzenia", "in_progress", "#b7791f", False),
    ("task", "in_review", "W sprawdzaniu", "in_progress", "#7b5ea7", False),
    ("task", "done", "Zakończone", "done", "#1f8a68", False),
    ("milestone", "planned", "Planowany", "todo", "#8a97a6", True),
    ("milestone", "active", "Aktywny", "in_progress", "#1c6aa8", False),
    ("milestone", "done", "Zakończony", "done", "#1f8a68", False),
    ("milestone", "cancelled", "Anulowany", "done", "#9b3d3d", False),
]


def seed_catalog(apps, schema_editor):
    Permission = apps.get_model("api", "Permission")
    Role = apps.get_model("api", "Role")
    RolePermission = apps.get_model("api", "RolePermission")
    Status = apps.get_model("api", "Status")

    perms = {}
    for code, description, scope in PERMISSIONS:
        perms[code], _ = Permission.objects.get_or_create(
            code=code, defaults={"description": description, "scope": scope}
        )

    for code, name, scope, codes in ROLES:
        role, _ = Role.objects.get_or_create(
            organization=None, code=code, defaults={"name": name, "scope": scope}
        )
        RolePermission.objects.bulk_create(
            [RolePermission(role=role, permission=perms[c]) for c in codes],
            ignore_conflicts=True,
        )

    for position, (applies_to, code, name, category, color, is_default) in enumerate(STATUSES):
        Status.objects.get_or_create(
            organization=None,
            applies_to=applies_to,
            code=code,
            defaults={
                "name": name,
                "category": category,
                "color": color,
                "position": position,
                "is_default": is_default,
            },
        )


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_catalog, migrations.RunPython.noop),
    ]
