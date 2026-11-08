# NoSQL model alignment with the repository PRD

## Intent

Move the MongoDB schema work from `stash@{0}` onto a branch based on `main` and make the schema follow the PRD and the current relational model wherever the local `nosql-mongodb-2.0.drawio` describes a different, unavailable version of the requirements.

## Goals

- Keep the document aggregate boundaries and indexes that are compatible with the PRD.
- Restore PRD semantics for project funding detachment, task ownership, funding organization, checklist items, and activity dictionaries.
- Accept Python/PyMongo integer encoding without requiring every caller to wrap identifiers in `bson.Int64`.
- Enforce the PRD attachment size range for every embedded attachment.
- Cover every corrected schema contract with focused unit tests that do not require a database server.

## Non-goals

- Updating `nosql-mongodb-2.0.drawio`.
- Adding MongoDB or replica-set configuration to Docker Compose.
- Implementing repositories, Unit of Work, retention recalculation, or other adapter behavior.
- Adding diagram-only `version` fields to comments or expenses.

## Approach

The chosen approach is PRD-first: retain the stashed schema as the starting point, remove or reshape fields that contradict the checked-in PRD/current Django models, and test the resulting `CollectionSpec` objects directly. The alternative diagram-first approach was rejected because the diagram names a later PRD that is not present in the repository. Converting every integer in a future mapper to `bson.Int64` was also rejected for now in favor of accepting BSON `int` and `long`, as requested, while updating partial index filters so `int32` identifiers are not silently excluded.

## Constraints

- `docs/PRD-promt-2.0.md` and current Django enums/models are authoritative.
- The ignored draw.io file is not added or edited in this change.
- Existing full Django tests need PostgreSQL; NoSQL schema tests must remain server-independent.
