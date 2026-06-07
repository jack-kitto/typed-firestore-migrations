# Orders example — typed-firestore-migrations walkthrough

Local **example project** for trying the CLI against an `orders` collection. Uses the Firestore emulator only — no Firebase credentials required.

## Prerequisites

- Node.js 20+
- From the repository root: `npm install` (npm workspaces install all packages)

## Setup

Open **two terminals**.

**Terminal 1 — start the emulator**

```bash
cd examples/orders
npm run emulator
```

**Terminal 2 — seed sample data**

```bash
cd examples/orders
npm run seed
```

## Walkthrough (copy-paste, no code editing)

All commands run from `examples/orders` in Terminal 2.

### 1. See pending migrations

```bash
npx firestore-migrate pending
```

Expected: two migration names, in order:

```
20240607120000-add-order-status
20240607130000-rename-display-name
```

### 2. Check status before apply

```bash
npx firestore-migrate status
```

Expected: both migrations listed under **Pending migrations**; executed is `(none)`.

### 3. Partial apply with `--to`

```bash
npx firestore-migrate up --to 20240607120000-add-order-status
```

Expected: only the first migration applied. Orders now have `status: "pending"`.

### 4. Check status after partial apply

```bash
npx firestore-migrate status
```

Expected: first migration under **Executed**; second still **Pending**.

### 5. Apply remaining migrations

```bash
npx firestore-migrate up
```

Expected: second migration runs. Orders now have `displayName` copied from `customerName`.

### 6. List executed migrations

```bash
npx firestore-migrate executed
```

Expected: both migration names.

### 7. Roll back the latest migration

```bash
npx firestore-migrate down
```

Expected: `20240607130000-rename-display-name` reverted; `displayName` removed from orders.

### 8. Roll back migrations after the first

```bash
npx firestore-migrate down --to 20240607120000-add-order-status
```

Expected: nothing left to roll back after step 7 (only first migration remains executed). If you skipped step 7, this rolls back the second migration while keeping the first.

To see multi-step rollback, run `npx firestore-migrate up` again to re-apply the second migration, then:

```bash
npx firestore-migrate down --to 20240607120000-add-order-status
```

### 9. Reset and try again

```bash
npm run reset
npx firestore-migrate pending
```

Expected: both migrations pending again; fresh sample orders.

---

## Appendix A — create your own migration

```bash
npx firestore-migrate create add-notes-field
```

Edit the generated file, then `npx firestore-migrate up`.

## Appendix B — generate a standalone copy with npx

From any directory:

```bash
npx create-typed-migration-app my-firestore-sandbox
cd my-firestore-sandbox
npm install
```

Then follow this README from **Setup** onward.

## Appendix C — use a real Firebase project

Replace `firebase-bootstrap.ts` with your credentials and remove `FIRESTORE_EMULATOR_HOST`. Do not run `npm run emulator`.

## Appendix D — official Firebase emulator

Replace `npm run emulator` with `firebase emulators:start --only firestore` (requires Java 21+). Keep bootstrap pointed at `127.0.0.1:8080`.
