Status: ready-for-agent

# Firestore storage adapter with claim and failure states

## Parent

`.scratch/typed-firestore-migrations/PRD.md`

## What to build

Implement a custom Umzug storage adapter backed by a Firestore **state collection**. One document per **migration name** (document ID). Support statuses: `running` (claimed), `executed` (with `executedAt`), `failed` (with `error`, `failedAt`). Implement per-migration transactional **migration lock**: transaction reads state doc; if absent, write `running` and commit; if present, fail fast.

Expose storage operations needed by Umzug: log migration executed, unlog on rollback, list executed, and custom methods for claim/release/fail. Configurable **state collection** name (default `_migrations`).

Test against Firestore emulator: claim succeeds on fresh migration; concurrent claim fails; executed state recorded; failed state recorded.

## Acceptance criteria

- [ ] Storage adapter implements Umzug storage interface
- [ ] Claim via transaction writes `running` only when doc absent
- [ ] Second concurrent claim on same migration name fails fast
- [ ] Successful run transitions `running` → `executed` with timestamp
- [ ] Thrown migration transitions `running` → `failed` with error message
- [ ] Rollback removes or updates executed state per Umzug unlog semantics
- [ ] Integration tests pass against Firestore emulator

## Blocked by

None — can start immediately (parallel with issue 01)
