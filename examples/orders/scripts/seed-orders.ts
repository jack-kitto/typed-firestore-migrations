import type {Firestore} from 'firebase-admin/firestore';
import {ordersRef} from '../src/refs.js';

const sampleOrders = [
  {customerName: 'Ada Lovelace'},
  {customerName: 'Grace Hopper'},
  {customerName: 'Katherine Johnson'},
];

export async function seedOrders(firestore: Firestore): Promise<void> {
  for (const order of sampleOrders) {
    await ordersRef(firestore).add(order);
  }

  console.log(`Seeded ${sampleOrders.length} orders.`);
}
