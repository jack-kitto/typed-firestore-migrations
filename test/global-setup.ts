import {firebaseMocker} from 'firebase-mocker';

export async function setup() {
  await firebaseMocker.startFirestoreServer({
    port: 8080,
    projectId: 'demo-test',
  });
}

export async function teardown() {
  await firebaseMocker.stopFirestoreServer();
}
