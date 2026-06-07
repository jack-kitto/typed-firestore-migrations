#!/usr/bin/env node
import {cac} from 'cac';
import {runCreate} from './create-migration.js';
import {runInit} from './init.js';
import {runDown, runExecuted, runPending, runStatus, runUp} from './cli-run.js';

async function main(): Promise<void> {
  const cli = cac('firestore-migrate');

  cli
    .command(
      'init',
      'Scaffold migrations config, bootstrap, and migrations directory',
    )
    .action(async () => {
      await runInit({cwd: process.cwd()});
      console.log(
        'Initialized typed-firestore-migrations in the current directory.',
      );
    });

  cli
    .command('create <slug>', 'Create a new migration file')
    .action(async (slug: string) => {
      const filepath = await runCreate({cwd: process.cwd(), slug});
      console.log(`Created migration ${filepath}`);
    });

  cli
    .command('up', 'Apply pending migrations')
    .option('--to <name>', 'Apply through this migration name, inclusive')
    .action(async (options: {to?: string}) => {
      await runUp({cwd: process.cwd(), to: options.to});
    });

  cli
    .command('down', 'Roll back executed migrations')
    .option('--to <name>', 'Roll back migrations after this migration name')
    .action(async (options: {to?: string}) => {
      await runDown({cwd: process.cwd(), to: options.to});
    });

  cli
    .command('status', 'Show executed and pending migrations')
    .action(async () => {
      await runStatus({cwd: process.cwd()});
    });

  cli.command('pending', 'List pending migrations').action(async () => {
    await runPending({cwd: process.cwd()});
  });

  cli.command('executed', 'List executed migrations').action(async () => {
    await runExecuted({cwd: process.cwd()});
  });

  cli.help();
  cli.version('0.0.0');

  cli.parse(undefined, {run: false});
  await cli.runMatchedCommand();
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`firestore-migrate: ${message}`);
  process.exit(1);
});
