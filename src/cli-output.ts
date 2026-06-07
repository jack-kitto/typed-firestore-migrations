import type {MigrationMeta} from 'umzug';

export function formatMigrationNames(migrations: MigrationMeta[]): string {
  if (migrations.length === 0) {
    return '(none)';
  }

  return migrations.map((migration) => migration.name).join('\n');
}

export function formatStatus(summary: {
  pending: MigrationMeta[];
  executed: MigrationMeta[];
}): string {
  return [
    'Executed migrations:',
    formatMigrationNames(summary.executed),
    '',
    'Pending migrations:',
    formatMigrationNames(summary.pending),
  ].join('\n');
}
