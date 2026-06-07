import type {processDocuments} from '@typed-firestore/server';
import type {Firestore} from 'firebase-admin/firestore';

export type MigrationContext = {
  firestore: Firestore;
  processDocuments: typeof processDocuments;
};
