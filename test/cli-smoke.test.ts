import {spawnSync, execSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {beforeAll, beforeEach, describe, expect, it} from 'vitest';
import {
  clearCollection,
  createTestFirestore,
} from './helpers/firestore-emulator.js';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(testDir, '..');
const cliPath = path.join(repoRoot, 'dist/cli.js');
const smokeFixturePath = path.join(testDir, 'fixtures/cli-smoke-project');
const migratorFixturePath = path.join(testDir, 'fixtures/migrator-project');
const failingFixturePath = path.join(
  testDir,
  'fixtures/failing-migration-project',
);

function runCli(arguments_: string[], cwd: string) {
  return spawnSync(process.execPath, [cliPath, ...arguments_], {
    cwd,
    env: process.env,
    encoding: 'utf8',
  });
}

describe('firestore-migrate CLI smoke test', () => {
  const firestore = createTestFirestore();

  beforeAll(() => {
    if (!existsSync(cliPath)) {
      execSync('npm run build', {cwd: repoRoot, stdio: 'inherit'});
    }
  });

  beforeEach(async () => {
    const migrationFiles = await readdir(
      path.join(smokeFixturePath, 'migrations'),
    ).catch(() => []);

    await Promise.all(
      migrationFiles.map(async (file) =>
        rm(path.join(smokeFixturePath, 'migrations', file)),
      ),
    );
    await clearCollection(firestore, '_migrations');
    await clearCollection(firestore, '_migration_effects');
  });

  it('runs create, up, status, down, and pending against the emulator', () => {
    const createResult = runCli(['create', 'add-test-field'], smokeFixturePath);
    expect(createResult.status).toBe(0);

    const createdMatch = /Created migration (.+)/.exec(createResult.stdout);
    expect(createdMatch).not.toBeNull();
    const migrationName = path.basename(createdMatch![1], '.ts');

    const upResult = runCli(['up'], smokeFixturePath);
    expect(upResult.status).toBe(0);
    expect(upResult.stdout).toContain(migrationName);

    const statusResult = runCli(['status'], smokeFixturePath);
    expect(statusResult.status).toBe(0);
    expect(statusResult.stdout).toContain('Executed migrations:');
    expect(statusResult.stdout).toContain(migrationName);

    const downResult = runCli(['down'], smokeFixturePath);
    expect(downResult.status).toBe(0);
    expect(downResult.stdout).toContain(migrationName);

    const pendingResult = runCli(['pending'], smokeFixturePath);
    expect(pendingResult.status).toBe(0);
    expect(pendingResult.stdout).toContain(migrationName);
  });

  it('exits non-zero when apply fails', () => {
    const result = runCli(['up'], failingFixturePath);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('firestore-migrate:');
  });

  it('passes --to through to up', async () => {
    await clearCollection(firestore, '_migrations');
    await clearCollection(firestore, '_migration_effects');

    const firstMigration = await import('node:fs/promises').then(async (fs) =>
      fs.readFile(
        path.join(migratorFixturePath, 'migrations/20240607120000-first.ts'),
        'utf8',
      ),
    );
    const secondMigration = await import('node:fs/promises').then(async (fs) =>
      fs.readFile(
        path.join(migratorFixturePath, 'migrations/20240607130000-second.ts'),
        'utf8',
      ),
    );
    const thirdMigration = await import('node:fs/promises').then(async (fs) =>
      fs.readFile(
        path.join(migratorFixturePath, 'migrations/20240607140000-third.ts'),
        'utf8',
      ),
    );

    await writeFile(
      path.join(smokeFixturePath, 'migrations/20240607120000-first.ts'),
      firstMigration,
      'utf8',
    );
    await writeFile(
      path.join(smokeFixturePath, 'migrations/20240607130000-second.ts'),
      secondMigration,
      'utf8',
    );
    await writeFile(
      path.join(smokeFixturePath, 'migrations/20240607140000-third.ts'),
      thirdMigration,
      'utf8',
    );

    const result = runCli(
      ['up', '--to', '20240607120000-first'],
      smokeFixturePath,
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('20240607120000-first');
    expect(result.stdout).not.toContain('20240607130000-second');
  });
});
