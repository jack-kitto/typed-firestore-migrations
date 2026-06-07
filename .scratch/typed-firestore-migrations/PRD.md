Status: ready-for-agent

# Typed Firestore Migrations — v1

## Problem Statement

Teams using Cloud Firestore lack a conventional, TypeScript-first way to run ordered, tracked data migrations. Existing options (ad-hoc scripts, archived tools like fireway) do not integrate with modern typed Firestore workflows, do not offer SQL-style lifecycle commands (`up`, `down`, `status`), or require manual migration registries. Developers need Firestore migrations to feel as routine as SQL migrations — minimal setup, automatic file discovery, reversible by default, and safe to run in CI.

## Solution

Publish `typed-firestore-migrations` with a `firestore-migrate` CLI and a programmatic **Migrator** API. Host projects add a **migrations config** and **bootstrap module**, write **migration files** as TypeScript modules, and run lifecycle commands against **migration state** stored in a Firestore **state collection**. Migrations receive a fixed **migration context** (`firestore` + `processDocuments`); **collection refs** stay in the host project. Umzug provides migration lifecycle semantics; a custom Firestore storage adapter handles claiming, execution tracking, and failure states.

## User Stories

1. As a backend developer, I want to initialize a migrations setup with one command, so that I can start writing migrations without boilerplate.
2. As a backend developer, I want to create a new migration file from a template by passing a slug, so that I follow naming conventions automatically.
3. As a backend developer, I want migration files discovered automatically from a glob, so that I never maintain a manual registry.
4. As a backend developer, I want to write migrations in TypeScript without a compile step, so that migration code matches my application codebase.
5. As a backend developer, I want to import my project's typed collection refs in migration files, so that migrations use the same types as application code.
6. As a backend developer, I want `up` to apply all pending migrations in order, so that CI can catch up to head in one command.
7. As a backend developer, I want `up --to <migration-name>` to apply only through a specific migration, so that I can test migrations incrementally on an emulator.
8. As a backend developer, I want `down` to roll back the latest migration, so that I can undo a bad deploy safely.
9. As a backend developer, I want `down --to <migration-name>` to roll back everything after a point, so that I can return to a known-good state.
10. As a backend developer, I want irreversible migrations to block rollback, so that I cannot accidentally reverse destructive work.
11. As a backend developer, I want `status`, `pending`, and `executed` commands, so that I can inspect migration state before and after runs.
12. As a backend developer, I want migration state stored in Firestore, so that runs are idempotent across machines and CI.
13. As a backend developer, I want concurrent migration runs to fail fast, so that two CI jobs cannot execute the same pending migration.
14. As a backend developer, I want failed migrations recorded with error metadata, so that I know what broke and can fix before retrying.
15. As a backend developer, I want to configure the bootstrap module path in a typed config file, so that setup is explicit and IDE-friendly.
16. As a backend developer, I want to override the migrations glob and state collection name, so that I can fit the tool into existing project layouts.
17. As a backend developer, I want the bootstrap to return whichever Firestore database my project uses, so that named databases work without tool changes.
18. As a backend developer, I want separate migration tracks for separate databases, so that each database has independent state.
19. As a CI engineer, I want a programmatic Migrator API, so that I can embed migrations in deploy scripts without subprocess overhead.
20. As a CI engineer, I want peer dependencies on `firebase-admin` and `@typed-firestore/server`, so that the tool uses my project's Firebase SDK versions.
21. As a backend developer, I want `create` to reject invalid slugs, so that migration names stay consistent in state.
22. As a backend developer, I want timestamp-prefixed migration filenames, so that ordering is chronological without merge conflicts on sequence numbers.
23. As a backend developer, I want `init` to scaffold a bootstrap stub, config file, and migrations directory, so that onboarding is one step.
24. As a backend developer, I want migration `up` and `down` to receive `processDocuments`, so that I can transform large collections with constant memory.
25. As a backend developer, I want failed migrations to block further runs until I manually reset state, so that partial writes are not silently re-attempted.

## Implementation Decisions

### Modules

| Module | Responsibility | Interface |
|--------|----------------|-----------|
| **Config** | Load and validate migrations config | `loadConfig(path?) → MigrationsConfig` |
| **Bootstrap loader** | Load host bootstrap module, return Firestore instance | `loadBootstrap(path) → Firestore` |
| **Migration resolver** | Discover migration files via glob; load `.ts` via jiti; validate exports | Umzug-compatible resolver |
| **Firestore storage** | Umzug storage adapter: claim, record executed/failed, query state | Implements Umzug storage interface |
| **Migrator** | Orchestrate Umzug with resolver, storage, context injection | `createMigrator(config) → { up, down, pending, executed, status }` |
| **CLI** | Parse commands; call Migrator; handle `init`/`create` filesystem work | `firestore-migrate <command>` |

### Config contract

`defineConfig` accepts:

- `bootstrap` (required) — path to bootstrap module
- `migrationsGlob` (optional, default `migrations/*.ts`)
- `stateCollection` (optional, default `_migrations`)

Bootstrap default-exports a ready Firestore instance.

### Migration file contract

Named exports:

- `up(context: MigrationContext): Promise<void>` — required
- `down(context: MigrationContext): Promise<void>` — required unless `irreversible` is true
- `irreversible?: boolean` — optional const export

`MigrationContext`:

```
{ firestore: Firestore; processDocuments: typeof processDocuments }
```

### Migration naming

- Filename: `{YYYYMMDDHHMMSS}-{slug}.ts`
- Migration name: basename without extension
- Slug: kebab-case, validated with `^[a-z0-9]+(-[a-z0-9]+)*$`

### State document shape

One document per migration in the state collection. Document ID = migration name.

Statuses:

- `running` — claimed, in-flight
- `executed` — completed successfully (with `executedAt`)
- `failed` — threw after claim (with `error`, `failedAt`)

Claim flow: Firestore transaction checks doc absent → write `running` → execute → write `executed` or `failed`. Concurrent claim fails fast.

### Apply and rollback

- `up`: all pending, in order. `up({ to: migrationName })` applies through that migration inclusive.
- `down`: latest only by default. `down({ to: migrationName })` rolls back everything after that name, reverse order. Stops at first irreversible migration.

### Package metadata

- npm: `typed-firestore-migrations`
- binary: `firestore-migrate`
- peerDependencies: `firebase-admin`, `@typed-firestore/server`
- directDependencies: `umzug`, `jiti`, CLI framework (e.g. `commander` or `cac`)

### TypeScript execution

Bundle `jiti` as a direct dependency. Migration resolver loads `.ts` files respecting host `tsconfig` paths when run from project root. Document that `migrations/` should be included in host tsconfig.

### CLI commands

| Command | Behavior |
|---------|----------|
| `init` | Scaffold config, bootstrap stub, `migrations/` directory |
| `create <slug>` | Validate slug; write timestamped file from template |
| `up [--to <name>]` | Apply pending migrations |
| `down [--to <name>]` | Rollback |
| `status` | Overview of pending and executed |
| `pending` | List pending only |
| `executed` | List executed only |

`init` and `create` are CLI-only (not on Migrator API).

## Testing Decisions

**Principle:** Test external behavior through public interfaces. Do not test Umzug internals or jiti loading mechanics in isolation — test through Migrator and storage adapter contracts.

**Modules to test:**

| Module | Approach |
|--------|----------|
| **Firestore storage** | Unit/integration tests against Firestore emulator: claim, execute, fail, concurrent claim rejection |
| **Migrator** | Integration tests with emulator + fixture migration files: apply, rollback, `--to`, irreversible block, failed block |
| **Config** | Unit tests: defaults, validation errors |
| **CLI** | Smoke tests invoking binary against fixture project (optional, lower priority than Migrator) |

**Prior art:** Greenfield repo — no existing test patterns. Use Vitest. Prefer Firestore emulator for storage and migrator integration tests.

## Out of Scope

- Indexes, security rules, composite index deploys
- Auto-retry or `--force` for failed migrations
- Stale `running` detection / automatic recovery
- `--wait` for lock polling
- Multiple migration targets in one config
- Injecting collection refs into migration context
- Affiliation with or scoped publishing under `@typed-firestore/*`
- Compiled JavaScript migration files (TypeScript only in v1)
- Dry-run mode

## Further Notes

- Not owned by the 0x80/typed-firestore maintainer. Source reference: https://github.com/0x80/typed-firestore
- Domain glossary: `CONTEXT.md` at repo root
- Implementation issues: `.scratch/typed-firestore-migrations/issues/`
- Migrations should be authored idempotent where possible; the tool does not enforce this
