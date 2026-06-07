import {getApps, initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';

const appName = 'typed-firestore-migrations-example-orders';
const app =
  getApps().find((existing) => existing.name === appName) ??
  initializeApp({projectId: 'demo-test'}, appName);

export default getFirestore(app);
