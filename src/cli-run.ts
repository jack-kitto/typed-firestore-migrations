import {createMigrator} from './migrator.js';
import {formatMigrationNames, formatStatus} from './cli-output.js';

export async function runUp(options: {
  cwd: string;
  to?: string;
}): Promise<void> {
  const migrator = await createMigrator({cwd: options.cwd});
  const applied = await migrator.up(options.to ? {to: options.to} : undefined);

  if (applied.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  console.log('Applied migrations:');
  console.log(formatMigrationNames(applied));
}

export async function runDown(options: {
  cwd: string;
  to?: string;
}): Promise<void> {
  const migrator = await createMigrator({cwd: options.cwd});
  const reverted = await migrator.down(
    options.to ? {to: options.to} : undefined,
  );

  if (reverted.length === 0) {
    console.log('No executed migrations to roll back.');
    return;
  }

  console.log('Rolled back migrations:');
  console.log(formatMigrationNames(reverted));
}

export async function runStatus(options: {cwd: string}): Promise<void> {
  const migrator = await createMigrator({cwd: options.cwd});
  const summary = await migrator.status();
  console.log(formatStatus(summary));
}

export async function runPending(options: {cwd: string}): Promise<void> {
  const migrator = await createMigrator({cwd: options.cwd});
  console.log(formatMigrationNames(await migrator.pending()));
}

export async function runExecuted(options: {cwd: string}): Promise<void> {
  const migrator = await createMigrator({cwd: options.cwd});
  console.log(formatMigrationNames(await migrator.executed()));
}
