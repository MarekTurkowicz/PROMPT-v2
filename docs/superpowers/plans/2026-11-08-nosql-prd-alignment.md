# NoSQL PRD Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the stashed MongoDB model to a branch from `main` and align its schema contracts with the repository PRD.

**Architecture:** Keep the existing `CollectionSpec` structure and correct declarative schemas and indexes in place. Add database-free pytest coverage that inspects generated validators and `IndexModel` documents.

**Tech Stack:** Python 3.13, PyMongo 4.19, pytest, mypy

**Spec:** `docs/superpowers/specs/2026-11-08-nosql-prd-alignment-design.md`

## Global Constraints

- `docs/PRD-promt-2.0.md` and the current Django model enums are authoritative.
- Do not edit or add the ignored draw.io model.
- Do not add MongoDB/replica-set infrastructure or adapter behavior.
- Tests must not require PostgreSQL or MongoDB.

## Review Focus

- BSON `int32` identifiers must satisfy schemas and participate in partial indexes.
- Detached project-funding records must remain addressable without blocking a later attachment of the same funding.
- A task must always belong to a project and cannot contain a direct `funding_id`.
- Every attachment must reject zero bytes and values above 50 MiB.
- MongoDB activity dictionaries must exactly accept the current Django enum values.

---

### Task 1: PRD field and enum alignment

**Files:**
- Create: `backend/app/adapter/spi/nonrelational/tests/__init__.py`
- Create: `backend/app/adapter/spi/nonrelational/tests/test_prd_alignment.py`
- Modify: `backend/app/adapter/spi/nonrelational/models/projects.py`
- Modify: `backend/app/adapter/spi/nonrelational/models/fundings.py`
- Modify: `backend/app/adapter/spi/nonrelational/models/tasks.py`
- Modify: `backend/app/adapter/spi/nonrelational/models/activity_logs.py`

**Interfaces:**
- Consumes: `CollectionSpec.schema` and current Django enum values.
- Produces: PRD-aligned schema dictionaries for projects, fundings, tasks, and activity logs.

- [ ] **Step 1: Write failing schema tests** for `detached_at`, removal of diagram-only project/task/checklist fields, nullable funding organization, and exact audit dictionaries.
- [ ] **Step 2: Run the focused tests and verify failures describe the current stashed model.**
- [ ] **Step 3: Make the smallest declarative schema changes that satisfy the PRD.**
- [ ] **Step 4: Run the focused tests and verify they pass.**
- [ ] **Step 5: Commit the PRD field alignment.**

### Task 2: Numeric compatibility, attachments, and ID indexes

**Files:**
- Modify: `backend/app/adapter/spi/nonrelational/tests/test_prd_alignment.py`
- Modify: `backend/app/adapter/spi/nonrelational/models/_schema.py`
- Modify: model files containing ID-based `partialFilterExpression` values.

**Interfaces:**
- Consumes: schema helpers `bson`, `nullable`, and `attachment`.
- Produces: ID schemas accepting BSON `int`/`long`, ID partial filters covering both types, and attachments constrained to 1..50 MiB.

- [ ] **Step 1: Write failing tests** for identifier BSON types, ID partial filters, and attachment boundaries.
- [ ] **Step 2: Run tests and verify the expected failures.**
- [ ] **Step 3: Generalize helpers and update all affected index filters.**
- [ ] **Step 4: Run focused and static checks.**
- [ ] **Step 5: Commit numeric and attachment fixes.**

### Task 3: Stash cleanup and branch verification

**Files:**
- Modify: `docs/schemat/warianty/README.md`
- Preserve: all other files restored from `stash@{0}`.

**Interfaces:**
- Consumes: branch contents after Tasks 1-2.
- Produces: a branch without a README link to an ignored/uncommitted diagram.

- [ ] **Step 1: Remove only the broken README row introduced by the stash.**
- [ ] **Step 2: Run focused pytest, compileall, mypy, and inspect the final diff.**
- [ ] **Step 3: Record the unavailable PostgreSQL baseline separately from NoSQL results.**
- [ ] **Step 4: Commit the cleanup and verification artifacts.**
