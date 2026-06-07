import {getApps, initializeApp} from 'firebase-admin/app';
import {getFirestore, type Firestore} from 'firebase-admin/firestore';

const TEST_APP_NAME = 'typed-firestore-migrations-test';
const EMULATOR_HOST = '127.0.0.1:8080';

export function createTestFirestore(): Firestore {
  process.env.FIRESTORE_EMULATOR_HOST ??= EMULATOR_HOST;

  const existing = getApps().find((app) => app.name === TEST_APP_NAME);
  const app =
    existing ?? initializeApp({projectId: 'demo-test'}, TEST_APP_NAME);

  return getFirestore(app);
}

export async function clearCollection(
  firestore: Firestore,
  collectionPath: string,
): Promise<void> {
  const snapshot = await firestore.collection(collectionPath).get();

  if (snapshot.empty) {
    return;
  }

  const batch = firestore.batch();
  for (const document of snapshot.docs) {
    batch.delete(document.ref);
  }

  await batch.commit();
}
