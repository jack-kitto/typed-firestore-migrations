import {beforeEach, describe, expect, it} from 'vitest';
import {createFirestoreStorage} from '../src/storage.js';
import {
  clearCollection,
  createTestFirestore,
} from './helpers/firestore-emulator.js';

const STATE_COLLECTION = '_migrations';
const migrationName = '20240607120000-add-order-status';

describe('createFirestoreStorage', () => {
  const firestore = createTestFirestore();

  beforeEach(async () => {
    await clearCollection(firestore, STATE_COLLECTION);
  });

  it('claims a pending migration by writing running migration state', async () => {
    const storage = createFirestoreStorage({
      firestore,
      stateCollection: STATE_COLLECTION,
    });

    await storage.claimMigration({name: migrationName});

    const stateDocument = await firestore
      .collection(STATE_COLLECTION)
      .doc(migrationName)
      .get();

    expect(stateDocument.exists).toBe(true);
    expect(stateDocument.data()).toEqual({status: 'running'});
  });

  it('fails fast when claiming a migration that already has migration state', async () => {
    const storage = createFirestoreStorage({
      firestore,
      stateCollection: STATE_COLLECTION,
    });

    await storage.claimMigration({name: migrationName});

    await expect(storage.claimMigration({name: migrationName})).rejects.toThrow(
      `Migration lock failed: "${migrationName}" already has migration state`,
    );
  });

  it('records executed migration state after a successful run', async () => {
    const storage = createFirestoreStorage({
      firestore,
      stateCollection: STATE_COLLECTION,
    });

    await storage.claimMigration({name: migrationName});
    await storage.logMigration({name: migrationName, context: undefined});

    const stateDocument = await firestore
      .collection(STATE_COLLECTION)
      .doc(migrationName)
      .get();

    expect(stateDocument.data()).toMatchObject({status: 'executed'});
    expect(stateDocument.data()?.executedAt).toBeDefined();
  });

  it('records failed migration state when a claimed migration throws', async () => {
    const storage = createFirestoreStorage({
      firestore,
      stateCollection: STATE_COLLECTION,
    });
    const errorMessage = 'Migration up failed';

    await storage.claimMigration({name: migrationName});
    await storage.markFailed({name: migrationName, error: errorMessage});

    const stateDocument = await firestore
      .collection(STATE_COLLECTION)
      .doc(migrationName)
      .get();

    expect(stateDocument.data()).toMatchObject({
      status: 'failed',
      error: errorMessage,
    });
    expect(stateDocument.data()?.failedAt).toBeDefined();
  });

  it('lists executed migration names', async () => {
    const storage = createFirestoreStorage({
      firestore,
      stateCollection: STATE_COLLECTION,
    });
    const otherMigration = '20240607130000-rename-display-name';

    await storage.claimMigration({name: migrationName});
    await storage.logMigration({name: migrationName, context: undefined});

    await storage.claimMigration({name: otherMigration});
    await storage.markFailed({name: otherMigration, error: 'boom'});

    const executed = await storage.executed({context: undefined});

    expect(executed).toEqual([migrationName]);
  });

  it('unlogs an executed migration on rollback', async () => {
    const storage = createFirestoreStorage({
      firestore,
      stateCollection: STATE_COLLECTION,
    });

    await storage.claimMigration({name: migrationName});
    await storage.logMigration({name: migrationName, context: undefined});
    await storage.unlogMigration({name: migrationName, context: undefined});

    const stateDocument = await firestore
      .collection(STATE_COLLECTION)
      .doc(migrationName)
      .get();
    const executed = await storage.executed({context: undefined});

    expect(stateDocument.exists).toBe(false);
    expect(executed).toEqual([]);
  });
});
