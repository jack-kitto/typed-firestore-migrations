Status: ready-for-agent

# CLI up, down, status, pending, and executed commands

## Parent

`.scratch/typed-firestore-migrations/PRD.md`

## What to build

Wire the `firestore-migrate` CLI to the **Migrator** API (thin wrapper — no duplicated logic). Implement:

| Command | Maps to |
|---------|---------|
| `up [--to <name>]` | `migrator.up({ to })` |
| `down [--to <name>]` | `migrator.down({ to })` |
| `status` | summary of pending + executed |
| `pending` | `migrator.pending()` |
| `executed` | `migrator.executed()` |

CLI loads config from cwd, initializes migrator, prints human-readable output, exits non-zero on failure. Document peer dependencies (`firebase-admin`, `@typed-firestore/server`) and host project setup (tsconfig includes migrations, run from project root).

Smoke test: init fixture project → create migration → up → status shows executed → down → pending shows migration again.

## Acceptance criteria

- [ ] All six run/status commands invoke Migrator methods
- [ ] `--to` flag parsed and passed to `up`/`down`
- [ ] Non-zero exit code on migration failure, lock conflict, or irreversible block
- [ ] `status`, `pending`, `executed` print migration names in order
- [ ] README documents install, peer deps, config, bootstrap, and CLI usage
- [ ] Smoke test covers init → create → up → down lifecycle

## Blocked by

- `.scratch/typed-firestore-migrations/issues/04-apply-rollback-semantics.md`
- `.scratch/typed-firestore-migrations/issues/05-cli-init-and-create.md`
