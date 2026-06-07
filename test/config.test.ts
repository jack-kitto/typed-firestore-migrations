import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {defineConfig, loadBootstrap, loadConfig} from '../src/config.js';

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe('defineConfig', () => {
  it('returns the config object for typed host config files', () => {
    const config = defineConfig({bootstrap: './firebase-bootstrap.ts'});

    expect(config).toEqual({bootstrap: './firebase-bootstrap.ts'});
  });
});

describe('loadConfig', () => {
  it('applies migrationsGlob and stateCollection defaults when only bootstrap is set', async () => {
    const config = await loadConfig({
      cwd: path.join(testDir, 'fixtures/minimal-config'),
    });

    expect(config).toEqual({
      bootstrap: './firebase-bootstrap.ts',
      migrationsGlob: 'migrations/*.ts',
      stateCollection: '_migrations',
    });
  });

  it('throws when bootstrap is missing', async () => {
    await expect(
      loadConfig({
        cwd: path.join(testDir, 'fixtures/missing-bootstrap-config'),
      }),
    ).rejects.toThrow('Migrations config requires a bootstrap module path');
  });
});

describe('loadBootstrap', () => {
  it('returns the default export from the bootstrap module', async () => {
    const cwd = path.join(testDir, 'fixtures/minimal-config');
    const config = await loadConfig({cwd});
    const firestore = await loadBootstrap(config, {cwd});

    expect(firestore).toEqual({_fixture: 'firestore-instance'});
  });
});
