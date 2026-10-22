# PROMT 2.0 — Plan • Run • Optimise Management Tool

A web platform that supports project managers and their teams in day-to-day project work: planning, task execution, funding requirements, time and cost tracking — for many organizations in one system.

> 📄 Polish version: [README.pl.md](./README.pl.md)

---

## What is new in 2.0

PROMT 2.0 builds on the original PROMT (engineering diploma thesis) and extends it from a single-team tool into a multi-organization platform.

- **Organizations and members** — one account, many organizations, a separate profile in each of them
- **Roles and groups** — flexible permissions at organization and project level, with group hierarchy
- **Configurable workflow** — custom task statuses per organization or project, five priority levels
- **Milestones and checklists** — structure work inside a project and inside a task
- **Funding-driven tasks** — tasks generated automatically from funding requirements
- **Time and cost tracking** — timesheets, expenses and budget overview per funding source
- **Collaboration** — comments, attachments, activity history and notifications

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React · TypeScript · Vite · Redux Toolkit / RTK Query |
| Backend | Python · Django · Django REST Framework · Pydantic |
| Database | PostgreSQL |
| Testing | pytest · Vitest · Testing Library · Playwright |
| Environment | Docker · Docker Compose |

---

## Getting started

### Requirements

- Docker Desktop (Windows / macOS) or Docker Engine (Linux)
- WSL2 on Windows
- Git

### 1. Clone

```bash
git clone https://github.com/MarekTurkowicz/PROMPT-v2.git
cd PROMPT-v2
```

### 2. Configure

```bash
cp .env.example .env
```

Adjust the values in `.env` (secret key, database credentials, admin account).

### 3. Run

```bash
docker compose up --build
```

On start the backend applies migrations and creates the default admin account from `.env`.

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/ |
| Admin panel | http://localhost:8000/admin/ |

### Tests

```bash
# backend
docker compose exec backend pytest

# frontend unit tests
cd frontend && npm test

# end-to-end (see docs/testing/e2e.md)
cd frontend && npx playwright test --config=playwright.config.ts
```

---

## Project structure

```
backend/    Django project (REST API, domain logic, tests)
frontend/   React application (features, pages, components, tests)
docs/       Project documentation
```

---

## Roadmap

Work is planned in [GitHub Issues](https://github.com/MarekTurkowicz/PROMPT-v2/issues) and grouped into milestones:

| Milestone | Scope |
|---|---|
| M0 – Setup | repository, tooling, CI |
| M1 – Data model | new domain model |
| M2 – Domain logic | permissions, automation, notifications |
| M3 – REST API | endpoints and API documentation |
| M4 – Frontend | new screens and workflows |
| M5 – Testing | automated tests on all levels |
| M6 – Course deliverables | university course deliverables |

Next step after 2.0: a microservice-based architecture (PROMT 3.0).

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for branch naming, commit conventions and the pull request flow.
