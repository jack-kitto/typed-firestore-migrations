import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const appName = "irreversible-migration-fixture-bootstrap";
const app =
  getApps().find((existing) => existing.name === appName) ??
  initializeApp({ projectId: "demo-test" }, appName);

export default getFirestore(app);
