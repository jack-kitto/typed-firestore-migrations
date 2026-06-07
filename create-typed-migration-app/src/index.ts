#!/usr/bin/env node
import {cp, mkdir, access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const targetArgument = process.argv[2];

if (!targetArgument) {
  console.error('Usage: create-typed-migration-app <directory>');
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), targetArgument);
const packageDir = path.dirname(fileURLToPath(import.meta.url));
const bundledTemplate = path.join(packageDir, '..', 'template');
const repoTemplate = path.join(packageDir, '..', '..', 'examples', 'orders');

let templateDir = bundledTemplate;

try {
  await access(bundledTemplate);
} catch {
  templateDir = repoTemplate;
}

try {
  await access(targetDir);
  console.error(`Refusing to overwrite existing directory: ${targetDir}`);
  process.exit(1);
} catch {
  // Directory does not exist — ok
}

await mkdir(targetDir, {recursive: true});
await cp(templateDir, targetDir, {
  recursive: true,
  filter: (source) => !source.includes(`${path.sep}node_modules${path.sep}`),
});

console.log(`Created typed-firestore-migrations example app at ${targetDir}`);
console.log('');
console.log('Next steps:');
console.log(`  cd ${targetArgument}`);
console.log('  npm install');
console.log('  npm run emulator    # terminal 1');
console.log('  npm run seed        # terminal 2');
console.log('  npx firestore-migrate pending');
