import {FieldValue} from 'firebase-admin/firestore';
import type {MigrationContext} from 'typed-firestore-migrations';
import {ordersRef} from '../src/refs.js';

export async function up({context}: {context: MigrationContext}) {
  const {firestore, processDocuments} = context;

  await processDocuments(ordersRef(firestore), null, async (order) => {
    if (order.data.displayName === undefined) {
      await order.update({displayName: order.data.customerName});
    }
  });
}

export async function down({context}: {context: MigrationContext}) {
  const {firestore, processDocuments} = context;

  await processDocuments(ordersRef(firestore), null, async (order) => {
    if (order.data.displayName !== undefined) {
      await order.update({displayName: FieldValue.delete()});
    }
  });
}
