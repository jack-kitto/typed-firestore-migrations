import {
  FieldValue,
  type Timestamp,
  type Firestore,
} from 'firebase-admin/firestore';
import type {UmzugStorage} from 'umzug';

export type RunningMigrationState = {
  status: 'running';
};

export type ExecutedMigrationState = {
  status: 'executed';
  executedAt: Timestamp;
};

export type FailedMigrationState = {
  status: 'failed';
  error: string;
  failedAt: Timestamp;
};

export type MigrationState =
  | RunningMigrationState
  | ExecutedMigrationState
  | FailedMigrationState;

export type FirestoreStorage = UmzugStorage & {
  claimMigration: (parameters: {name: string}) => Promise<void>;
  claimRollback: (parameters: {name: string}) => Promise<void>;
  markFailed: (parameters: {name: string; error: string}) => Promise<void>;
  assertNoFailedMigrations: () => Promise<void>;
};

export function createFirestoreStorage(options: {
  firestore: Firestore;
  stateCollection?: string;
}): FirestoreStorage {
  const stateCollection = options.stateCollection ?? '_migrations';

  return {
    async claimMigration({name}) {
      const stateReference = options.firestore
        .collection(stateCollection)
        .doc(name);

      await options.firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(stateReference);

        if (snapshot.exists) {
          throw new Error(
            `Migration lock failed: "${name}" already has migration state`,
          );
        }

        transaction.set(stateReference, {status: 'running'});
      });
    },

    async claimRollback({name}) {
      const stateReference = options.firestore
        .collection(stateCollection)
        .doc(name);

      await options.firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(stateReference);

        if (!snapshot.exists || snapshot.data()?.status !== 'executed') {
          throw new Error(
            `Migration lock failed: "${name}" is not an executed migration`,
          );
        }

        transaction.update(stateReference, {status: 'running'});
      });
    },

    async logMigration({name}) {
      const stateReference = options.firestore
        .collection(stateCollection)
        .doc(name);

      await stateReference.update({
        status: 'executed',
        executedAt: FieldValue.serverTimestamp(),
      });
    },

    async markFailed({name, error}) {
      const stateReference = options.firestore
        .collection(stateCollection)
        .doc(name);

      await stateReference.update({
        status: 'failed',
        error,
        failedAt: FieldValue.serverTimestamp(),
      });
    },

    async assertNoFailedMigrations() {
      const snapshot = await options.firestore
        .collection(stateCollection)
        .get();

      const failedMigration = snapshot.docs.find(
        (document) => document.data()?.status === 'failed',
      );

      if (!failedMigration) {
        return;
      }

      const {error} = failedMigration.data() as FailedMigrationState;

      throw new Error(
        `Apply blocked by failed migration "${failedMigration.id}": ${error}`,
      );
    },

    async unlogMigration({name}) {
      await options.firestore.collection(stateCollection).doc(name).delete();
    },

    async executed() {
      const snapshot = await options.firestore
        .collection(stateCollection)
        .get();

      return snapshot.docs
        .filter((document) => document.data()?.status === 'executed')
        .map((document) => document.id)
        .sort();
    },
  };
}
