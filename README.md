# typed-firestore-migrations

TypeScript-first Firestore data migrations for Node.js — ordered, tracked, and reversible by default.

Built at Cafe Cursor Bangkok — see [ACKNOWLEDGEMENTS.md](ACKNOWLEDGEMENTS.md). Project site: [jack-kitto.github.io/typed-firestore-migrations](https://jack-kitto.github.io/typed-firestore-migrations/).

## Install

```bash
npm install typed-firestore-migrations
```

Peer dependencies (install in your host project):

```bash
npm install firebase-admin @typed-firestore/server
```

Use `@typed-firestore/server` **2.3.1+** if you rely on `processDocuments` in migration context types.

## Try it locally (example project)

Clone this repository, then:

```bash
npm install
cd examples/orders
npm run emulator   # terminal 1
npm run seed       # terminal 2
npx firestore-migrate pending
```

Full copy-paste walkthrough: [examples/orders/README.md](examples/orders/README.md).

Or scaffold a standalone copy anywhere:

```bash
npx create-typed-migration-app my-firestore-sandbox
cd my-firestore-sandbox
npm install
```

## Quick start (production host project)

From your project root:

```bash
npx firestore-migrate init
npx firestore-migrate create add-order-status
npx firestore-migrate up
npx firestore-migrate status
```

## Host project setup

1. Run commands from the project root (where `firestore-migrations.config.ts` lives).
2. Configure `firebase-bootstrap.ts` with your Firebase Admin credentials.
3. Include `migrations/` in your host `tsconfig.json` so TypeScript resolves migration imports.
4. Point your bootstrap at the Firestore database you want to migrate (default or named DB).

### Config

`firestore-migrations.config.ts`:

```ts
import { defineConfig } from "typed-firestore-migrations";

export default defineConfig({
  bootstrap: "./firebase-bootstrap.ts",
  // migrationsGlob: "migrations/*.ts",  // default
  // stateCollection: "_migrations",     // default
});
```

### Bootstrap

Your bootstrap module default-exports a Firestore Admin instance:

```ts
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app =
  getApps()[0] ??
  initializeApp({
    /* credentials */
  });
export default getFirestore(app);
```

## CLI commands

| Command              | Description                                               |
| -------------------- | --------------------------------------------------------- |
| `init`               | Scaffold config, bootstrap stub, and `migrations/`        |
| `create <slug>`      | Create `{timestamp}-{slug}.ts` (kebab-case slug required) |
| `up [--to <name>]`   | Apply pending migrations                                  |
| `down [--to <name>]` | Roll back latest, or migrations after `<name>`            |
| `status`             | Show executed and pending migrations                      |
| `pending`            | List pending migration names                              |
| `executed`           | List executed migration names                             |

Migration slugs must match `^[a-z0-9]+(-[a-z0-9]+)*$` (e.g. `add-order-status`).

## Programmatic API

```ts
import { createMigrator } from "typed-firestore-migrations";

const migrator = await createMigrator();
await migrator.up();
await migrator.down();
const { pending, executed } = await migrator.status();
```

## Migration files

Each migration exports `up` and `down` (unless `export const irreversible = true`):

```ts
import type { MigrationContext } from "typed-firestore-migrations";

export async function up({ context }: { context: MigrationContext }) {
  const { firestore, processDocuments } = context;
}

export async function down({ context }: { context: MigrationContext }) {
  const { firestore, processDocuments } = context;
}
```

Import collection refs directly in migration files — the tool does not inject them.

## Failure and rollback rules

- A failed migration blocks further `up` runs until you manually reset its state document.
- Concurrent apply attempts fail fast via per-migration Firestore locks.
- Irreversible migrations block rollback with a clear error naming the migration.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Releases are automated from conventional commits on `main`.
