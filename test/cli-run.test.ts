import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {
  runDown,
  runExecuted,
  runPending,
  runStatus,
  runUp,
} from '../src/cli-run.js';
import {
  clearCollection,
  createTestFirestore,
} from './helpers/firestore-emulator.js';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(testDir, 'fixtures/migrator-project');

describe('cli run commands', () => {
  const firestore = createTestFirestore();

  beforeEach(async () => {
    await clearCollection(firestore, '_migrations');
    await clearCollection(firestore, '_migration_effects');
    vi.restoreAllMocks();
  });

  it('runUp applies migrations and prints applied names', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runUp({cwd: fixturePath, to: '20240607120000-first'});

    expect(logSpy.mock.calls.flat().join('\n')).toContain(
      '20240607120000-first',
    );
  });

  it('runDown rolls back the latest migration', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runUp({cwd: fixturePath});
    await runDown({cwd: fixturePath});

    expect(logSpy.mock.calls.flat().join('\n')).toContain(
      '20240607140000-third',
    );
  });

  it('runStatus prints pending and executed migration names', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runUp({cwd: fixturePath, to: '20240607120000-first'});
    await runStatus({cwd: fixturePath});

    const output = logSpy.mock.calls.flat().join('\n');
    expect(output).toContain('Executed migrations:');
    expect(output).toContain('20240607120000-first');
    expect(output).toContain('Pending migrations:');
    expect(output).toContain('20240607130000-second');
  });

  it('runPending and runExecuted print migration names in order', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runPending({cwd: fixturePath});
    expect(logSpy.mock.calls.at(-1)?.[0]).toBe(
      '20240607120000-first\n20240607130000-second\n20240607140000-third',
    );

    await runUp({cwd: fixturePath, to: '20240607130000-second'});
    logSpy.mockClear();

    await runExecuted({cwd: fixturePath});
    expect(logSpy.mock.calls.at(-1)?.[0]).toBe(
      '20240607120000-first\n20240607130000-second',
    );
  });
});
