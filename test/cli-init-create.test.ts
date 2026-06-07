import {existsSync} from 'node:fs';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {
  migrationFilename,
  renderMigrationTemplate,
  runCreate,
} from '../src/create-migration.js';
import {runInit} from '../src/init.js';
import {validateMigrationSlug} from '../src/slug.js';

describe('runInit', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'tfm-init-'));
  });

  afterEach(async () => {
    await rm(tempDir, {recursive: true, force: true});
  });

  it('creates config, bootstrap stub, and migrations directory', async () => {
    await runInit({cwd: tempDir});

    expect(
      existsSync(path.join(tempDir, 'firestore-migrations.config.ts')),
    ).toBe(true);
    expect(existsSync(path.join(tempDir, 'firebase-bootstrap.ts'))).toBe(true);
    expect(existsSync(path.join(tempDir, 'migrations'))).toBe(true);

    const config = await readFile(
      path.join(tempDir, 'firestore-migrations.config.ts'),
      'utf8',
    );
    expect(config).toContain('defineConfig({');
    expect(config).toContain('bootstrap: "./firebase-bootstrap.ts"');
  });

  it('does not overwrite existing scaffold files', async () => {
    await runInit({cwd: tempDir});

    await expect(runInit({cwd: tempDir})).rejects.toThrow(
      'Refusing to overwrite existing file: firestore-migrations.config.ts',
    );
  });
});

describe('runCreate', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'tfm-create-'));
    await runInit({cwd: tempDir});
    await writeFile(
      path.join(tempDir, 'firestore-migrations.config.ts'),
      `export default {
  bootstrap: "./firebase-bootstrap.ts",
};
`,
      'utf8',
    );
  });

  afterEach(async () => {
    await rm(tempDir, {recursive: true, force: true});
  });

  it('writes a timestamped migration file for a valid slug', async () => {
    const now = new Date(2024, 5, 7, 12, 0, 0);
    const filepath = await runCreate({
      cwd: tempDir,
      slug: 'add-order-status',
      now,
    });

    expect(path.basename(filepath)).toBe('20240607120000-add-order-status.ts');
    expect(existsSync(filepath)).toBe(true);
  });

  it('writes a template with typed up and down exports', async () => {
    const filepath = await runCreate({
      cwd: tempDir,
      slug: 'add-order-status',
      now: new Date(2024, 5, 7, 12, 0, 0),
    });
    const contents = await readFile(filepath, 'utf8');

    expect(contents).toBe(renderMigrationTemplate());
    expect(contents).toContain(
      'import type { MigrationContext } from "typed-firestore-migrations"',
    );
    expect(contents).toContain('export async function up');
    expect(contents).toContain('export async function down');
  });

  it('fails when the generated migration filename already exists', async () => {
    const now = new Date(2024, 5, 7, 12, 0, 0);

    await runCreate({cwd: tempDir, slug: 'add-order-status', now});

    await expect(
      runCreate({cwd: tempDir, slug: 'add-order-status', now}),
    ).rejects.toThrow(
      'Migration file already exists: 20240607120000-add-order-status.ts',
    );
  });
});

describe('validateMigrationSlug', () => {
  it('rejects invalid slugs with format guidance', () => {
    expect(() => {
      validateMigrationSlug('AddOrderStatus');
    }).toThrow(
      'Invalid migration slug "AddOrderStatus". Use kebab-case like add-order-status',
    );
    expect(() => {
      validateMigrationSlug('add_order_status');
    }).toThrow(
      'Invalid migration slug "add_order_status". Use kebab-case like add-order-status',
    );
    expect(() => {
      validateMigrationSlug('add order status');
    }).toThrow(
      'Invalid migration slug "add order status". Use kebab-case like add-order-status',
    );
  });

  it('accepts strict kebab-case slugs', () => {
    expect(
      migrationFilename('add-order-status', new Date(2024, 5, 7, 12, 0, 0)),
    ).toBe('20240607120000-add-order-status.ts');
  });
});
