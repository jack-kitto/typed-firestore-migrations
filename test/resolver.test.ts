import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {describe, expect, it} from 'vitest';
import {
  loadMigrationModule,
  validateMigrationExports,
} from '../src/resolver.js';

const testDir = path.dirname(fileURLToPath(import.meta.url));

describe('validateMigrationExports', () => {
  it('throws when a migration file is missing an up export', async () => {
    const module = await loadMigrationModule(
      path.join(
        testDir,
        'fixtures/invalid-migration-project/migrations/20240607120000-missing-up.ts',
      ),
    );

    expect(() => {
      validateMigrationExports('20240607120000-missing-up', module);
    }).toThrow(
      'Migration "20240607120000-missing-up" must export an up function',
    );
  });

  it('allows irreversible migrations to omit down', async () => {
    const module = await loadMigrationModule(
      path.join(
        testDir,
        'fixtures/irreversible-migration-project/migrations/20240607120000-drop-legacy-field.ts',
      ),
    );

    expect(() => {
      validateMigrationExports('20240607120000-drop-legacy-field', module);
    }).not.toThrow();
  });
});
