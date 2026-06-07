import firestore from '../firebase-bootstrap.js';
import {seedOrders} from './seed-orders.js';

async function clearCollection(collectionPath: string): Promise<void> {
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

await clearCollection('_migrations');
await clearCollection('orders');
await seedOrders(firestore);

console.log(
  'Reset complete. Migration state and orders cleared; sample orders re-seeded.',
);
