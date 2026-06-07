import {existsSync} from 'node:fs';
import {mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

const CONFIG_FILENAME = 'firestore-migrations.config.ts';
const BOOTSTRAP_FILENAME = 'firebase-bootstrap.ts';
const MIGRATIONS_DIR = 'migrations';

function renderConfigTemplate(): string {
  return `import { defineConfig } from "typed-firestore-migrations";

export default defineConfig({
  bootstrap: "./${BOOTSTRAP_FILENAME}",
});
`;
}

function renderBootstrapTemplate(): string {
  return `import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const app =
  getApps()[0] ??
  initializeApp({
    // TODO: configure Firebase Admin credentials for your environment
  });

export default getFirestore(app);
`;
}

export async function runInit(options: {cwd: string}): Promise<void> {
  const configPath = path.join(options.cwd, CONFIG_FILENAME);
  const bootstrapPath = path.join(options.cwd, BOOTSTRAP_FILENAME);
  const migrationsDir = path.join(options.cwd, MIGRATIONS_DIR);

  if (existsSync(configPath)) {
    throw new Error(`Refusing to overwrite existing file: ${CONFIG_FILENAME}`);
  }

  if (existsSync(bootstrapPath)) {
    throw new Error(
      `Refusing to overwrite existing file: ${BOOTSTRAP_FILENAME}`,
    );
  }

  if (existsSync(migrationsDir)) {
    throw new Error(
      `Refusing to overwrite existing directory: ${MIGRATIONS_DIR}/`,
    );
  }

  await writeFile(configPath, renderConfigTemplate(), 'utf8');
  await writeFile(bootstrapPath, renderBootstrapTemplate(), 'utf8');
  await mkdir(migrationsDir, {recursive: true});
}
