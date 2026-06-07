import firestore from '../firebase-bootstrap.js';
import {seedOrders} from './seed-orders.js';

await seedOrders(firestore);
