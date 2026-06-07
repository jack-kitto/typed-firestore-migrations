# Contributing

Thanks for your interest in **typed-firestore-migrations**. This project is MIT-licensed; by contributing, you agree to license your contributions under the same terms.

## Development setup

```bash
git clone https://github.com/jack-kitto/typed-firestore-migrations.git
cd typed-firestore-migrations
npm install
npm test
npm run build
```

## Commit messages

Releases are automated with [semantic-release](https://semantic-release.gitbook.io/) on `main`. Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Effect |
|--------|--------|
| `feat:` | Minor release |
| `fix:` | Patch release |
| `feat!:` or `BREAKING CHANGE:` footer | Major release |
| `chore:`, `docs:`, `test:`, etc. | No release (unless configured) |

Both npm packages (`typed-firestore-migrations` and `create-typed-migration-app`) are released together from this repository.

## Before you open a PR

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Pre-commit hooks run lint-staged (`xo --fix`) and typecheck on staged files.

## Planning artifacts

Historical PRD and issue slices from v1 development live under [`.scratch/typed-firestore-migrations/`](.scratch/typed-firestore-migrations/). Forward-looking work is tracked in [GitHub Issues](https://github.com/jack-kitto/typed-firestore-migrations/issues).

## Publishing

Maintainer-only steps for npm and GitHub Releases: see [PUBLISHING.md](PUBLISHING.md).
