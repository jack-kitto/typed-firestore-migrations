import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {beforeEach, describe, expect, it} from 'vitest';
import {createMigrator} from '../src/migrator.js';
import {
  clearCollection,
  createTestFirestore,
} from './helpers/firestore-emulator.js';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(testDir, 'fixtures/migrator-project');

describe('createMigrator', () => {
  const firestore = createTestFirestore();

  beforeEach(async () => {
    await clearCollection(firestore, '_migrations');
    await clearCollection(firestore, '_migration_effects');
  });

  it('lists pending migration names in timestamp order', async () => {
    const migrator = await createMigrator({cwd: fixturePath});

    const pending = await migrator.pending();

    expect(pending.map((migration) => migration.name)).toEqual([
      '20240607120000-first',
      '20240607130000-second',
      '20240607140000-third',
    ]);
  });

  it('applies all pending migrations on up() and records executed migration state', async () => {
    const migrator = await createMigrator({cwd: fixturePath});

    await migrator.up();

    const executed = await migrator.executed();
    expect(executed.map((migration) => migration.name)).toEqual([
      '20240607120000-first',
      '20240607130000-second',
      '20240607140000-third',
    ]);

    const firstEffect = await firestore
      .collection('_migration_effects')
      .doc('first')
      .get();
    const secondEffect = await firestore
      .collection('_migration_effects')
      .doc('second')
      .get();

    expect(firstEffect.data()).toEqual({applied: true});
    expect(secondEffect.data()).toEqual({applied: true});
  });

  it('does not re-apply migrations when up() runs again', async () => {
    const migrator = await createMigrator({cwd: fixturePath});

    await migrator.up();
    await migrator.up();

    const executed = await migrator.executed();
    expect(executed.map((migration) => migration.name)).toEqual([
      '20240607120000-first',
      '20240607130000-second',
      '20240607140000-third',
    ]);
  });

  it('throws when a migration file is missing an up export', async () => {
    const invalidFixturePath = path.join(
      testDir,
      'fixtures/invalid-migration-project',
    );

    await expect(createMigrator({cwd: invalidFixturePath})).rejects.toThrow(
      'Migration "20240607120000-missing-up" must export an up function',
    );
  });

  it('loads irreversible migrations without a down export', async () => {
    const irreversibleFixturePath = path.join(
      testDir,
      'fixtures/irreversible-migration-project',
    );
    const migrator = await createMigrator({cwd: irreversibleFixturePath});

    const pending = await migrator.pending();

    expect(pending.map((migration) => migration.name)).toEqual([
      '20240607120000-drop-legacy-field',
    ]);
  });

  it('reports pending and executed migrations from status()', async () => {
    const migrator = await createMigrator({cwd: fixturePath});

    const before = await migrator.status();
    expect(before.pending.map((migration) => migration.name)).toEqual([
      '20240607120000-first',
      '20240607130000-second',
      '20240607140000-third',
    ]);
    expect(before.executed).toEqual([]);

    await migrator.up();

    const after = await migrator.status();
    expect(after.pending).toEqual([]);
    expect(after.executed.map((migration) => migration.name)).toEqual([
      '20240607120000-first',
      '20240607130000-second',
      '20240607140000-third',
    ]);
  });
});
