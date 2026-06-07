# Typed Firestore Migrations

A TypeScript-first CLI and library for running ordered, tracked data migrations against Cloud Firestore in Node.js projects. Published as `typed-firestore-migrations`; CLI binary `firestore-migrate`.

## Language

**Migration**:
An ordered, tracked unit of Firestore document transformation. Each migration has an `up` that applies a data change and a `down` that reverses it. Reversibility is the norm.
_Avoid_: Schema migration, DDL, deploy step, script, one-off job

**Irreversible migration**:
A migration explicitly marked as non-reversible. Supported as an escape hatch, but discouraged — destructive or lossy work (e.g. purging archived documents) belongs in a script, not a migration.
_Avoid_: One-way migration, no-down migration

**Migration file**:
A TypeScript module with named exports `up` and `down`, optionally `irreversible`. Named `{timestamp}-{slug}.ts`; timestamp is `YYYYMMDDHHMMSS`.
_Avoid_: Script, job, backfill

**Migration slug**:
The kebab-case descriptor the dev passes to `create` (e.g. `add-order-status`). Must match `^[a-z0-9]+(-[a-z0-9]+)*$` — no auto-normalization. Combined with a generated timestamp to form the **migration name**.
_Avoid_: Title, description, migration name

**Migration name**:
The migration file's basename without extension (e.g. `20240607120000-rename-display-name`). Used as the state document ID and as the ordering key.
_Avoid_: ID, version, revision

**Migration state**:
The record of which migrations have been executed, persisted in Firestore so runs are idempotent across machines and CI. One document per executed migration; the document ID is the migration name.
_Avoid_: Meta table, SequelizeMeta, ledger

**State collection**:
The Firestore collection holding migration state. Defaults to `_migrations`; overridable in config. Isolation between environments comes from whichever Firestore instance the bootstrap connects to — not from collection suffixes.
_Avoid_: Meta collection, SequelizeMeta, migrations table

**Migration lock**:
A per-migration Firestore transaction that claims a pending migration before `up` or `down` runs. If the claim fails, the runner fails fast — another process already holds it.
_Avoid_: Mutex, advisory lock, semaphore

**Running migration**:
A migration whose state document exists with `running` status — claimed by an in-flight runner. If stale (crashed runner), v1 requires manual cleanup before retrying.
_Avoid_: In-progress, locked, pending execution

**Failed migration**:
A migration whose `up` or `down` threw after being claimed. State is `failed` with error metadata. Blocks further runs until manual reset — the tool does not auto-retry or assume a clean partial state.
_Avoid_: Broken migration, errored, stuck

**Rollback**:
Reversing executed migrations by running `down`, one at a time in reverse execution order. Default: the latest only. `--to <migration-name>` rolls back everything after that migration; stops at the first irreversible migration.
_Avoid_: Revert, undo, downgrade

**Apply**:
Running pending migrations via `up`. Default: all pending, in order. `--to <migration-name>` applies only through that migration, inclusive.
_Avoid_: Migrate, run, upgrade

**Migration context**:
The runtime argument passed to every `up` and `down`: a Firestore Admin instance and `processDocuments` from `@typed-firestore/server`. Fixed shape — not an open-ended bag.
_Avoid_: Bootstrap bag, query interface, ctx

**Bootstrap module**:
A host-project module named in config that initializes Firebase Admin and default-exports a ready Firestore instance. Database selection (default or named) is the host's responsibility — the tool does not configure it.
_Avoid_: Config, firebase setup, db module

**Migration track**:
One migrations config + bootstrap + state collection targeting one Firestore database. Multiple databases require separate tracks — not one config with multiple targets.
_Avoid_: Pipeline, channel, environment

**Migrations config**:
The host project's `firestore-migrations.config.ts` — typed via `defineConfig`. Names the bootstrap module; optionally overrides migrations glob and state collection.
_Avoid_: Settings, config file, .rc

**CLI**:
The `firestore-migrate` binary shipped by `typed-firestore-migrations`. Commands: `init`, `create`, `up`, `down`, `status`, `pending`, `executed`. `create <slug>` scaffolds a new **migration file** from a template.
_Avoid_: fireway, tfm, typed-firestore-migrations (as a command)

**Migrator**:
The programmatic entry point (`createMigrator`) for embedding apply, rollback, and status checks in host code. The CLI is a thin wrapper over the same methods.
_Avoid_: Client, runner, engine, Umzug instance

**Collection refs**:
Typed collection references defined and owned by the host project. Migrations import them directly — the tool does not inject or discover refs.
_Avoid_: Schema, models, collections config

**Example project**:
A self-contained **host project** shipped in the tool's repository for local walkthrough. Targets the Firestore emulator only — no credentials or cloud project required. Ships pre-scaffolded config, bootstrap, and **migration files** so the reader can exercise apply, rollback, and status via the CLI without writing migrations first. Not a production deployment template.
_Avoid_: Demo app, starter kit, sandbox repo, test fixture

**Example app scaffolder**:
A separate npm package (`create-typed-migration-app`) invoked via `npx create-typed-migration-app <dir>`. Copies the canonical **example project** template into a new directory on the reader's machine. Produces a standalone **host project** with normal npm dependencies — not `file:..`. Distinct from `firestore-migrate init`, which scaffolds a minimal production **host project** only. The in-repo **example project** at `examples/orders/` is the template source of truth. Shipped alongside the in-repo **example project** in the same release.
_Avoid_: init, boilerplate generator, template repo

**Release**:
A versioned publish of the npm packages (`typed-firestore-migrations`, `create-typed-migration-app`) to the public registry. The in-repo **example project** is not published. Version numbers follow semantic versioning; releases are automated from conventional commits on the default branch.
_Avoid_: Deploy, publish, npm push, tag

**Project site**:
The public GitHub Pages landing for the repository — a lightweight entry point with install instructions and links to full documentation. Distinct from the root README, which remains the technical reference.
_Avoid_: Docs site, marketing page, homepage

## Out of scope

Indexes, security rules, composite index deploys, and other Firebase CLI / infrastructure changes are not migrations. They stay outside this tool.

## Example dialogue

**Dev:** We're adding `status` to every `orders` document — is that a migration?

**Expert:** Yes. That's a **migration**: `up` backfills `status: 'pending'` where missing; `down` removes the field.

**Dev:** We also need a composite index on `(userId, createdAt)`. Same migration?

**Expert:** No. Indexes are out of scope — handle that in `firestore.indexes.json` and your normal Firebase deploy.

**Dev:** Can a migration create a new collection?

**Expert:** Only if it's a **data** change — e.g. seeding documents. An empty collection with no documents isn't really a migration; Firestore creates collections implicitly when you write.

**Dev:** What about a migration that deletes 50k archived orders?

**Expert:** That's not really a **migration** — there's no meaningful `down`. Run it as a script. If you really want it tracked in the migration history, use an **irreversible migration**, but know you're stretching the model.

**Dev:** Does the tool pass our `refs` into `up`?

**Expert:** No. **Collection refs** stay in your project — migrations import them. The tool passes **migration context**: `firestore` and `processDocuments`. Your **bootstrap module** handles credentials and returns the Firestore instance.

**Dev:** How do I start a new migration?

**Expert:** Run `firestore-migrate create add-order-status`. The **CLI** generates `20240607120000-add-order-status.ts` from a template — you pass the **migration slug**, it adds the timestamp.
