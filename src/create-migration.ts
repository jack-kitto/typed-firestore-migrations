import {existsSync} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {loadConfig} from './config.js';
import {validateMigrationSlug} from './slug.js';

export function formatMigrationTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
}

export function migrationFilename(slug: string, date: Date): string {
  validateMigrationSlug(slug);
  return `${formatMigrationTimestamp(date)}-${slug}.ts`;
}

export function renderMigrationTemplate(): string {
  return `import type { MigrationContext } from "typed-firestore-migrations";

export async function up({ context }: { context: MigrationContext }) {
  const { firestore, processDocuments } = context;

  // TODO: apply migration
}

export async function down({ context }: { context: MigrationContext }) {
  const { firestore, processDocuments } = context;

  // TODO: rollback migration
}
`;
}

function migrationsDirectory(cwd: string, migrationsGlob: string): string {
  const globDirectory = migrationsGlob.split('*')[0]?.replace(/\/$/, '');

  return path.join(cwd, globDirectory || 'migrations');
}

export async function runCreate(options: {
  cwd: string;
  slug: string;
  now?: Date;
  configPath?: string;
}): Promise<string> {
  validateMigrationSlug(options.slug);

  const config = await loadConfig({
    cwd: options.cwd,
    configPath: options.configPath,
  });
  const now = options.now ?? new Date();
  const filename = migrationFilename(options.slug, now);
  const migrationsDir = migrationsDirectory(options.cwd, config.migrationsGlob);
  const filepath = path.join(migrationsDir, filename);

  if (existsSync(filepath)) {
    throw new Error(`Migration file already exists: ${filename}`);
  }

  await writeFile(filepath, renderMigrationTemplate(), 'utf8');

  return filepath;
}
