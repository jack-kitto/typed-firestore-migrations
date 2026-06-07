import path from 'node:path';
import {createJiti} from 'jiti';
import {glob} from 'tinyglobby';
import type {MigrationParams, RunnableMigration} from 'umzug';
import {processDocuments} from '@typed-firestore/server';
import type {Firestore} from 'firebase-admin/firestore';
import type {ResolvedMigrationsConfig} from './config.js';
import {createFirestoreStorage, type FirestoreStorage} from './storage.js';
import type {MigrationContext} from './types.js';

export type LoadedMigrationModule = {
  up?: unknown;
  down?: unknown;
  irreversible?: unknown;
};

export function validateMigrationExports(
  migrationName: string,
  module: LoadedMigrationModule,
): void {
  if (typeof module.up !== 'function') {
    throw new TypeError(
      `Migration "${migrationName}" must export an up function`,
    );
  }

  const irreversible = module.irreversible === true;

  if (!irreversible && typeof module.down !== 'function') {
    throw new Error(
      `Migration "${migrationName}" must export a down function or export irreversible as true`,
    );
  }
}

export async function discoverMigrationPaths(
  cwd: string,
  migrationsGlob: string,
): Promise<string[]> {
  const paths = await glob(migrationsGlob, {
    cwd,
    absolute: true,
    expandDirectories: false,
  });

  return paths.sort();
}

export function migrationNameFromPath(filepath: string): string {
  return path.basename(filepath, path.extname(filepath));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function loadMigrationModule(
  filepath: string,
): Promise<LoadedMigrationModule> {
  const jiti = createJiti(import.meta.url);
  const loaded = await jiti.import(filepath);

  if (typeof loaded !== 'object' || loaded === null) {
    throw new Error(
      `Migration file "${filepath}" must export migration functions`,
    );
  }

  return loaded as LoadedMigrationModule;
}

export function createRunnableMigration(
  filepath: string,
  module: LoadedMigrationModule,
  storage: FirestoreStorage,
): RunnableMigration<MigrationContext> {
  const name = migrationNameFromPath(filepath);
  validateMigrationExports(name, module);

  const wrapUpWithClaim = (
    function_: (
      parameters: MigrationParams<MigrationContext>,
    ) => Promise<unknown>,
  ) => {
    return async (parameters: MigrationParams<MigrationContext>) => {
      await storage.claimMigration({name: parameters.name});

      try {
        await function_(parameters);
      } catch (error) {
        await storage.markFailed({
          name: parameters.name,
          error: getErrorMessage(error),
        });
        throw error;
      }
    };
  };

  const wrapDownWithClaim = (
    function_: (
      parameters: MigrationParams<MigrationContext>,
    ) => Promise<unknown>,
  ) => {
    return async (parameters: MigrationParams<MigrationContext>) => {
      await storage.claimRollback({name: parameters.name});

      try {
        await function_(parameters);
      } catch (error) {
        await storage.markFailed({
          name: parameters.name,
          error: getErrorMessage(error),
        });
        throw error;
      }
    };
  };

  return {
    name,
    path: filepath,
    up: wrapUpWithClaim(
      module.up as (
        parameters: MigrationParams<MigrationContext>,
      ) => Promise<unknown>,
    ),
    down:
      module.irreversible === true
        ? async () => {
            throw new Error(
              `Rollback blocked by irreversible migration "${name}"`,
            );
          }
        : typeof module.down === 'function'
          ? wrapDownWithClaim(
              module.down as (
                parameters: MigrationParams<MigrationContext>,
              ) => Promise<unknown>,
            )
          : undefined,
  };
}

export async function resolveMigrations(
  config: ResolvedMigrationsConfig,
  options: {cwd: string; storage: FirestoreStorage},
): Promise<Array<RunnableMigration<MigrationContext>>> {
  const paths = await discoverMigrationPaths(
    options.cwd,
    config.migrationsGlob,
  );

  return Promise.all(
    paths.map(async (filepath) => {
      const module = await loadMigrationModule(filepath);
      return createRunnableMigration(filepath, module, options.storage);
    }),
  );
}

export function createMigrationContext(firestore: Firestore): MigrationContext {
  return {
    firestore,
    processDocuments,
  };
}
