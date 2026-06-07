Status: ready-for-agent

# CLI init and create commands

## Parent

`.scratch/typed-firestore-migrations/PRD.md`

## What to build

Implement `firestore-migrate init` and `firestore-migrate create <slug>`.

`init` scaffolds in the current working directory:
- `firestore-migrations.config.ts` using `defineConfig` with bootstrap path
- Bootstrap module stub (Firebase Admin init + default-export Firestore)
- Empty `migrations/` directory

`create <slug>`:
- Validates **migration slug** against `^[a-z0-9]+(-[a-z0-9]+)*$`; rejects with helpful error
- Generates filename `{YYYYMMDDHHMMSS}-{slug}.ts`
- Writes from template: named `up`/`down` exports, `MigrationContext` import, placeholder body
- Fails if generated filename already exists

## Acceptance criteria

- [ ] `firestore-migrate init` creates config, bootstrap stub, and migrations directory
- [ ] `init` does not overwrite existing files without error
- [ ] `firestore-migrate create add-order-status` writes timestamped file in migrations directory
- [ ] Invalid slugs (spaces, PascalCase, snake_case) rejected with format guidance
- [ ] Template exports `up` and `down` with typed `MigrationContext`
- [ ] Duplicate filename collision fails with clear error

## Blocked by

- `.scratch/typed-firestore-migrations/issues/01-package-foundation-and-config.md`
