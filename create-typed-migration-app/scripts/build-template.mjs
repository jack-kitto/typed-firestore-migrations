#!/usr/bin/env node
import {cp, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.join(__dirname, '..');
const repoRoot = path.join(packageRoot, '..');
const sourceDir = path.join(repoRoot, 'examples', 'orders');
const templateDir = path.join(packageRoot, 'template');
const rootPackage = JSON.parse(
  await readFile(path.join(repoRoot, 'package.json'), 'utf8'),
);

await cp(sourceDir, templateDir, {
  recursive: true,
  filter: (source) => !source.includes(`${path.sep}node_modules${path.sep}`),
});

const templatePackagePath = path.join(templateDir, 'package.json');
const templatePackage = JSON.parse(await readFile(templatePackagePath, 'utf8'));

templatePackage.name = 'typed-firestore-migrations-app';
delete templatePackage.private;
templatePackage.dependencies['typed-firestore-migrations'] =
  `^${rootPackage.version}`;

await writeFile(
  templatePackagePath,
  `${JSON.stringify(templatePackage, null, 2)}\n`,
  'utf8',
);

console.log(`Built template from ${sourceDir}`);
