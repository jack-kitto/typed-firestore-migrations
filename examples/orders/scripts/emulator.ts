import {firebaseMocker} from 'firebase-mocker';

await firebaseMocker.startFirestoreServer({
  port: 8080,
  projectId: 'demo-test',
});

console.log('Firestore emulator running at http://127.0.0.1:8080');
console.log('Press Ctrl+C to stop.');

const shutdown = async () => {
  await firebaseMocker.stopFirestoreServer();
  process.exit(0);
};

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});

await new Promise(() => {});
