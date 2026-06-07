import {describe, expect, it} from 'vitest';
import {formatMigrationNames, formatStatus} from '../src/cli-output.js';

describe('formatMigrationNames', () => {
  it('prints migration names one per line in order', () => {
    expect(
      formatMigrationNames([
        {name: '20240607120000-first'},
        {name: '20240607130000-second'},
      ]),
    ).toBe('20240607120000-first\n20240607130000-second');
  });

  it('prints a placeholder when there are no migrations', () => {
    expect(formatMigrationNames([])).toBe('(none)');
  });
});

describe('formatStatus', () => {
  it('prints executed and pending migration names', () => {
    const output = formatStatus({
      executed: [{name: '20240607120000-first'}],
      pending: [{name: '20240607130000-second'}],
    });

    expect(output).toContain('Executed migrations:');
    expect(output).toContain('20240607120000-first');
    expect(output).toContain('Pending migrations:');
    expect(output).toContain('20240607130000-second');
  });
});
