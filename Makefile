UV := uv --project backend
NPM := npm --prefix frontend

.DEFAULT_GOAL := help
.PHONY: help install up down logs migrate makemigrations shell mypy lint test-backend \
	test-frontend frontend-lint typecheck e2e check

help: ## Show available commands
	@grep -E '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "} {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## Install backend (uv) and frontend (npm) dependencies
	$(UV) sync
	$(NPM) install

up: ## Build and start the stack with Docker Compose
	docker compose up --build -d

down: ## Stop the Docker Compose stack
	docker compose down

logs: ## Follow logs of the Docker Compose stack
	docker compose logs -f

migrate: ## Apply Django migrations in the backend container
	docker compose exec backend python manage.py migrate

makemigrations: ## Create Django migrations in the backend container
	docker compose exec backend python manage.py makemigrations

shell: ## Open a Django shell in the backend container
	docker compose exec backend python manage.py shell

mypy: ## Type-check the backend (config: mypy.ini)
	$(UV) run mypy

lint: ## Run all pre-commit hooks (ruff, formatting, checks)
	uvx pre-commit run --all-files

test-backend: ## Run backend tests in the backend container
	docker compose exec backend pytest

test-frontend: ## Run frontend unit tests once
	$(NPM) run test:run

frontend-lint: ## Lint the frontend with ESLint
	$(NPM) run lint

typecheck: ## Type-check the frontend with tsc
	$(NPM) run typecheck

e2e: ## Run Playwright end-to-end tests in Docker
	docker compose --profile test run --rm playwright

check: lint mypy frontend-lint typecheck test-frontend ## Run all checks that do not need Docker
