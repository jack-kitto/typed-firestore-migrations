import type {Firestore} from 'firebase-admin/firestore';
import {Umzug, type MigrateUpOptions, type Umzug as UmzugType} from 'umzug';
import {loadBootstrap, loadConfig} from './config.js';
import {createMigrationContext, resolveMigrations} from './resolver.js';
import {createFirestoreStorage, type FirestoreStorage} from './storage.js';
import type {MigrationContext} from './types.js';

export type Migrator = {
  up: (options?: {
    to?: string;
  }) => ReturnType<UmzugType<MigrationContext>['up']>;
  down: (options?: {
    to?: string;
  }) => ReturnType<UmzugType<MigrationContext>['down']>;
  pending: () => ReturnType<UmzugType<MigrationContext>['pending']>;
  executed: () => ReturnType<UmzugType<MigrationContext>['executed']>;
  status: () => Promise<{
    pending: Awaited<ReturnType<UmzugType<MigrationContext>['pending']>>;
    executed: Awaited<ReturnType<UmzugType<MigrationContext>['executed']>>;
  }>;
};

function createGuardedUp(
  umzug: UmzugType<MigrationContext>,
  storage: FirestoreStorage,
) {
  return async (options?: {to?: string}) => {
    await storage.assertNoFailedMigrations();

    const upOptions: MigrateUpOptions | undefined = options?.to
      ? {to: options.to}
      : undefined;

    return umzug.up(upOptions);
  };
}

function createGuardedDown(umzug: UmzugType<MigrationContext>) {
  return async (options?: {to?: string}) => {
    if (!options?.to) {
      return umzug.down();
    }

    const executed = await umzug.executed();
    const targetIndex = executed.findIndex(
      (migration) => migration.name === options.to,
    );

    if (targetIndex === -1) {
      throw new Error(
        `Couldn't find executed migration to roll back after ${JSON.stringify(options.to)}`,
      );
    }

    const migrationsToRevert = executed
      .slice(targetIndex + 1)
      .map((migration) => migration.name)
      .reverse();

    if (migrationsToRevert.length === 0) {
      return [];
    }

    return umzug.down({migrations: migrationsToRevert});
  };
}

export async function createMigrator(
  options: {
    cwd?: string;
    configPath?: string;
  } = {},
): Promise<Migrator> {
  const cwd = options.cwd ?? process.cwd();
  const config = await loadConfig({cwd, configPath: options.configPath});
  const firestore = (await loadBootstrap(config, {cwd})) as Firestore;
  const storage = createFirestoreStorage({
    firestore,
    stateCollection: config.stateCollection,
  });
  const context = createMigrationContext(firestore);
  const migrations = await resolveMigrations(config, {cwd, storage});

  const umzug = new Umzug<MigrationContext>({
    migrations,
    context,
    storage,
    logger: undefined,
  });

  return {
    up: createGuardedUp(umzug, storage),
    down: createGuardedDown(umzug),
    pending: async () => umzug.pending(),
    executed: async () => umzug.executed(),
    status: async () => ({
      pending: await umzug.pending(),
      executed: await umzug.executed(),
    }),
  };
}
