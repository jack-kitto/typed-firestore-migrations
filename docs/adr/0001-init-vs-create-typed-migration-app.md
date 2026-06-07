# Separate `init` from `create-typed-migration-app`

`firestore-migrate init` scaffolds a minimal production **host project** — config, bootstrap, empty `migrations/`. That is the right default when someone is starting real work.

`create-typed-migration-app` scaffolds a full **example project** — pre-written migrations, collection refs, seed/reset/emulator scripts, and a walkthrough README. That is the right entry point for learning or testing the tool locally.

We rejected folding the example into `init --example` because it would blur two intents: production onboarding vs sandbox exploration. We rejected replacing `init` entirely because most host projects do not want sample migrations and emulator scripts in their tree.

The in-repo **example project** at `examples/orders/` is the template source of truth; the scaffolder copies it and swaps `file:..` for a normal npm dependency on `typed-firestore-migrations`.
