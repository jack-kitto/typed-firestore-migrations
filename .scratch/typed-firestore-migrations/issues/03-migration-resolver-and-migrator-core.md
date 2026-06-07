Status: ready-for-agent

# Migration resolver and Migrator core

## Parent

`.scratch/typed-firestore-migrations/PRD.md`

## What to build

Implement TypeScript **migration file** discovery via configurable glob and jiti-based loading. Validate each file exports `up` (required) and `down` (required unless `irreversible` is exported). Wire Umzug with the Firestore storage adapter (issue 02) and config/bootstrap loading (issue 01).

Implement `createMigrator()` returning `{ up, down, pending, executed, status }`. Inject **migration context** into every `up`/`down` call: `{ firestore, processDocuments }` where `firestore` comes from bootstrap and `processDocuments` is imported from `@typed-firestore/server`.

Integration test: fixture project with two migration files runs `up` — both applied in timestamp order, state docs created, second run is no-op.

## Acceptance criteria

- [ ] Glob discovery finds `migrations/*.ts` (or configured glob) in lexicographic order
- [ ] jiti loads TypeScript migration files without pre-compilation
- [ ] Missing `up` export throws descriptive error
- [ ] `irreversible` migrations may omit `down`
- [ ] `createMigrator()` applies all pending migrations on `up()`
- [ ] Migration context provides `firestore` and `processDocuments`
- [ ] `pending()` and `executed()` return correct migration names
- [ ] Integration test with emulator + fixture migrations passes

## Blocked by

- `.scratch/typed-firestore-migrations/issues/01-package-foundation-and-config.md`
- `.scratch/typed-firestore-migrations/issues/02-firestore-storage-adapter.md`
