# Contributing

## Branches

| Branch | Role |
|---|---|
| `main` | stable releases only – updated by a pull request from `develop` |
| `develop` | integration branch – all feature work is merged here |
| `feature/…`, `fix/…`, `chore/…` | short-lived work branches created from `develop` |

`main` and `develop` are protected: changes go through pull requests only.

## Workflow

1. Pick an issue from [Issues](https://github.com/MarekTurkowicz/PROMPT-v2/issues) and assign yourself.
2. Update `develop` and create a branch from it (naming below).
3. Commit in small steps (conventions below).
4. Open a Pull Request to `develop` with `Closes #<issue>` in the description.
5. Merge after the checks pass and the review is done.
6. A release is a pull request from `develop` to `main`.

## Branch naming

`<type>/<issue-number>-<short-description>` — lowercase, words separated with hyphens.

| Type | Use for | Example |
|---|---|---|
| `feature/` | new functionality | `feature/5-custom-user-model` |
| `fix/` | bug fix | `fix/31-kanban-filter` |
| `docs/` | documentation | `docs/1-readme-update` |
| `chore/` | tooling, CI, cleanup | `chore/4-github-actions` |
| `test/` | tests only | `test/48-constraint-tests` |
| `refactor/` | code changes without new behaviour | `refactor/19-access-service` |

```bash
git switch develop && git pull
git switch -c feature/5-custom-user-model
```

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), in English, imperative mood:

```
<type>: <short summary>

<optional body: what and why>
```

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `style`, `perf`.

Examples:

```
feat: add organization switcher to the header (#38)
fix: keep task priority when moving between statuses (#42)
docs: describe local setup with Docker
```

## Pull requests

- One issue per pull request, as small as practical.
- Description: what changed, how to test it, `Closes #<issue>`.
- Tests and lint pass locally before requesting a review.
