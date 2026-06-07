import {access, mkdtemp, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {afterEach, beforeAll, describe, expect, it} from 'vitest';

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const scaffolderEntry = path.join(
  repoRoot,
  'create-typed-migration-app/dist/index.js',
);

describe('create-typed-migration-app', () => {
  let temporaryParent: string;

  beforeAll(() => {
    const build = spawnSync(
      'npm',
      ['run', 'build', '--workspace', 'create-typed-migration-app'],
      {
        cwd: repoRoot,
        stdio: 'inherit',
        shell: true,
      },
    );

    if (build.status !== 0) {
      throw new Error('Failed to build create-typed-migration-app');
    }
  });

  afterEach(async () => {
    if (temporaryParent) {
      await rm(temporaryParent, {recursive: true, force: true});
    }
  });

  it('scaffolds a standalone example app with npm dependency on typed-firestore-migrations', async () => {
    temporaryParent = await mkdtemp(path.join(os.tmpdir(), 'tfm-scaffold-'));
    const appDir = path.join(temporaryParent, 'my-sandbox');

    const result = spawnSync(process.execPath, [scaffolderEntry, appDir], {
      cwd: temporaryParent,
      encoding: 'utf8',
    });

    expect(result.status).toBe(0);
    await access(path.join(appDir, 'firestore-migrations.config.ts'));
    await access(
      path.join(appDir, 'migrations/20240607120000-add-order-status.ts'),
    );

    const packageJson = JSON.parse(
      await readFile(path.join(appDir, 'package.json'), 'utf8'),
    ) as {dependencies: Record<string, string>};

    expect(packageJson.dependencies['typed-firestore-migrations']).toMatch(
      /^\^/,
    );
    expect(
      packageJson.dependencies['typed-firestore-migrations'],
    ).not.toContain('file:');
  });
});
