import {
  type CollectionReference,
  type Firestore,
} from 'firebase-admin/firestore';
import type {Order} from './types.js';

export function ordersRef(firestore: Firestore): CollectionReference<Order> {
  return firestore.collection('orders') as CollectionReference<Order>;
}
