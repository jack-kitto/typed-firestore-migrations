Status: ready-for-agent

# Apply, rollback, irreversible, and failed-migration blocking

## Parent

`.scratch/typed-firestore-migrations/PRD.md`

## What to build

Extend the **Migrator** with full **apply** and **rollback** semantics:

- `up()`: all pending migrations in order
- `up({ to: migrationName })`: apply through named migration inclusive
- `down()`: rollback latest executed migration only
- `down({ to: migrationName })`: rollback all migrations after named migration, reverse order
- **Irreversible migration** with `export const irreversible = true`: blocks `down` and `down({ to })` when encountered; reports which migration blocked
- **Failed migration** state blocks further `up` until manual state reset; error message names the failed migration

Integration tests cover: partial apply via `--to`, single-step rollback, multi-step rollback via `--to`, irreversible stop, failed migration block.

## Acceptance criteria

- [ ] `up({ to })` applies only migrations up to and including target name
- [ ] `down()` rolls back exactly the latest executed migration
- [ ] `down({ to })` rolls back migrations after target in reverse order
- [ ] Rollback stops at irreversible migration with clear error
- [ ] `up()` fails fast when a failed migration exists in state
- [ ] Integration tests cover all scenarios against emulator

## Blocked by

- `.scratch/typed-firestore-migrations/issues/03-migration-resolver-and-migrator-core.md`
