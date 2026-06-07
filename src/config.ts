import path from 'node:path';
import {createJiti} from 'jiti';

export type MigrationsConfig = {
  bootstrap: string;
  migrationsGlob?: string;
  stateCollection?: string;
};

export type ResolvedMigrationsConfig = {
  bootstrap: string;
  migrationsGlob: string;
  stateCollection: string;
};

const DEFAULT_MIGRATIONS_GLOB = 'migrations/*.ts';
const DEFAULT_STATE_COLLECTION = '_migrations';
const CONFIG_FILENAME = 'firestore-migrations.config.ts';

function resolveDefaultExport<T>(loaded: unknown): T {
  if (typeof loaded === 'object' && loaded !== null && 'default' in loaded) {
    return (loaded as {default: T}).default;
  }

  return loaded as T;
}

export function defineConfig(config: MigrationsConfig): MigrationsConfig {
  return config;
}

export async function loadConfig(
  options: {
    cwd?: string;
    configPath?: string;
  } = {},
): Promise<ResolvedMigrationsConfig> {
  const cwd = options.cwd ?? process.cwd();
  const configPath = options.configPath ?? path.join(cwd, CONFIG_FILENAME);

  const jiti = createJiti(import.meta.url);
  const config = resolveDefaultExport<MigrationsConfig>(
    await jiti.import(configPath, {default: true}),
  );

  if (!config.bootstrap) {
    throw new Error('Migrations config requires a bootstrap module path');
  }

  return {
    bootstrap: config.bootstrap,
    migrationsGlob: config.migrationsGlob ?? DEFAULT_MIGRATIONS_GLOB,
    stateCollection: config.stateCollection ?? DEFAULT_STATE_COLLECTION,
  };
}

export async function loadBootstrap(
  config: ResolvedMigrationsConfig,
  options: {cwd?: string} = {},
): Promise<unknown> {
  const cwd = options.cwd ?? process.cwd();
  const bootstrapPath = path.resolve(cwd, config.bootstrap);

  const jiti = createJiti(import.meta.url);
  const loaded = await jiti.import(bootstrapPath, {default: true});

  return loaded;
}
