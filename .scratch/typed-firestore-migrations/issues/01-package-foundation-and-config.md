Status: ready-for-agent

# Package foundation and config loading

## Parent

`.scratch/typed-firestore-migrations/PRD.md`

## What to build

Scaffold the `typed-firestore-migrations` npm package with `firestore-migrate` binary entry point (stub OK for now). Export `defineConfig` and `MigrationContext` types. Implement config loading: read `firestore-migrations.config.ts` from project root (or explicit path), validate required `bootstrap` field, apply defaults for `migrationsGlob` (`migrations/*.ts`) and `stateCollection` (`_migrations`). Implement bootstrap loading: dynamic import of host bootstrap module, expect default export of a Firestore instance.

End-to-end verifiable outcome: a test fixture project can call `loadConfig()` and `loadBootstrap()` and receive a typed config object and Firestore instance (emulator-backed bootstrap stub).

## Acceptance criteria

- [ ] Package publishes `typed-firestore-migrations` with `firestore-migrate` bin registered
- [ ] `defineConfig` helper exported with typed `MigrationsConfig` shape
- [ ] `MigrationContext` type exported: `{ firestore, processDocuments }`
- [ ] Config loader resolves defaults and throws on missing `bootstrap`
- [ ] Bootstrap loader default-imports host module and returns Firestore instance
- [ ] Unit tests cover config defaults and validation errors

## Blocked by

None — can start immediately
