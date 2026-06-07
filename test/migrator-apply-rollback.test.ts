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
const rollbackFixturePath = path.join(testDir, 'fixtures/rollback-project');
const failingFixturePath = path.join(
  testDir,
  'fixtures/failing-migration-project',
);

describe('createMigrator apply and rollback', () => {
  const firestore = createTestFirestore();

  beforeEach(async () => {
    await clearCollection(firestore, '_migrations');
    await clearCollection(firestore, '_migration_effects');
  });

  it('applies pending migrations through the target migration name on up({ to })', async () => {
    const migrator = await createMigrator({cwd: fixturePath});

    await migrator.up({to: '20240607120000-first'});

    const executed = await migrator.executed();
    expect(executed.map((migration) => migration.name)).toEqual([
      '20240607120000-first',
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
    expect(secondEffect.exists).toBe(false);
  });

  it('rolls back exactly the latest executed migration on down()', async () => {
    const migrator = await createMigrator({cwd: fixturePath});

    await migrator.up();
    await migrator.down();

    const executed = await migrator.executed();
    expect(executed.map((migration) => migration.name)).toEqual([
      '20240607120000-first',
      '20240607130000-second',
    ]);

    const thirdEffect = await firestore
      .collection('_migration_effects')
      .doc('third')
      .get();
    expect(thirdEffect.exists).toBe(false);

    const secondEffect = await firestore
      .collection('_migration_effects')
      .doc('second')
      .get();
    expect(secondEffect.data()).toEqual({applied: true});

    const firstEffect = await firestore
      .collection('_migration_effects')
      .doc('first')
      .get();
    expect(firstEffect.data()).toEqual({applied: true});
  });

  it('rolls back migrations after the target migration name on down({ to })', async () => {
    const migrator = await createMigrator({cwd: fixturePath});

    await migrator.up();
    await migrator.down({to: '20240607120000-first'});

    const executed = await migrator.executed();
    expect(executed.map((migration) => migration.name)).toEqual([
      '20240607120000-first',
    ]);

    expect(
      (await firestore.collection('_migration_effects').doc('first').get())
        .exists,
    ).toBe(true);
    expect(
      (await firestore.collection('_migration_effects').doc('second').get())
        .exists,
    ).toBe(false);
    expect(
      (await firestore.collection('_migration_effects').doc('third').get())
        .exists,
    ).toBe(false);
  });

  it('blocks down() at an irreversible migration with a clear error', async () => {
    const migrator = await createMigrator({cwd: rollbackFixturePath});

    await migrator.up();
    await migrator.down();

    await expect(migrator.down()).rejects.toThrow(
      'Rollback blocked by irreversible migration "20240607130000-irreversible-step"',
    );
  });

  it('blocks down({ to }) when rollback would reach an irreversible migration', async () => {
    const migrator = await createMigrator({cwd: rollbackFixturePath});

    await migrator.up({to: '20240607130000-irreversible-step'});

    await expect(migrator.down({to: '20240607120000-first'})).rejects.toThrow(
      'Rollback blocked by irreversible migration "20240607130000-irreversible-step"',
    );
  });

  it('blocks up() while a failed migration remains in migration state', async () => {
    const migrator = await createMigrator({cwd: failingFixturePath});

    await expect(migrator.up()).rejects.toThrow('Migration up failed');

    await expect(migrator.up()).rejects.toThrow(
      'Apply blocked by failed migration "20240607130000-fails": Migration up failed',
    );
  });
});
