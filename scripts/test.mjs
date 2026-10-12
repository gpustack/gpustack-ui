import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// With no paths, run every discovered test (also used by PR CI). Explicit paths
// select files or directories relative to the project root; Git changes are not
// used to decide which tests run. See README.md for command examples.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const paths = process.argv.slice(2).filter((argument) => argument !== '--');

if (paths.includes('--help')) {
  console.log('Usage: pnpm test [file-or-directory ...]');
  process.exit(0);
}

const unsupportedOption = paths.find((argument) => argument.startsWith('-'));
if (unsupportedOption) {
  console.error(
    `Unsupported option: ${unsupportedOption}. Pass file or directory paths.`
  );
  process.exit(1);
}

// Discover Node/JSDOM suites only. Browser E2E belongs in e2e/**/*.spec.ts,
// with a separate local-only runner, outside this entry point and automatic CI.
let files = ['src', 'scripts']
  .flatMap((directory) =>
    readdirSync(join(projectRoot, directory), {
      recursive: true,
      withFileTypes: true
    })
  )
  .filter(
    (entry) => entry.isFile() && /\.test\.(ts|tsx|mts|mjs)$/.test(entry.name)
  )
  .map((entry) => join(entry.parentPath, entry.name))
  .sort();

if (paths.length) {
  const matches = paths.map((path) => {
    const target = resolve(projectRoot, path);
    // The separator keeps a directory selection from matching sibling names.
    return files.filter(
      (file) => file === target || file.startsWith(`${target}${sep}`)
    );
  });
  const unmatched = paths.filter((_, index) => !matches[index].length);
  if (unmatched.length) {
    // Catch every mistyped path, even when another selector matched a test.
    console.error(`No test files matched: ${unmatched.join(', ')}`);
    process.exit(1);
  }
  files = [...new Set(matches.flat())].sort();
}

if (!files.length) {
  console.error('No test files found in src/ or scripts/.');
  process.exit(1);
}

// Convention: .test.mts opts into module mocks and import conditions. Applying
// those conditions to ordinary tests can break CommonJS dependencies, so keep
// both groups in separate Node test runner processes.
const groups = [
  {
    name: 'Standard tests',
    files: files.filter((file) => !file.endsWith('.mts')),
    flags: []
  },
  {
    name: 'ESM tests',
    files: files.filter((file) => file.endsWith('.mts')),
    flags: ['--conditions=import', '--experimental-test-module-mocks']
  }
];

// Run groups sequentially; each Node runner already parallelizes test files.
for (const group of groups) {
  if (!group.files.length) continue;
  console.log(`\n${group.name}: ${group.files.length} file(s)`);
  const result = spawnSync(
    process.execPath,
    [
      ...group.flags,
      '--import',
      'tsx',
      '--test',
      '--test-force-exit',
      ...group.files.map((file) => relative(projectRoot, file))
    ],
    { cwd: projectRoot, stdio: 'inherit' }
  );
  // Run the remaining group after test failures, retaining any earlier failure
  // so a later successful group cannot make CI pass incorrectly.
  if (result.status !== 0) process.exitCode = 1;
  if (result.error || result.signal) {
    console.error(
      result.error?.message ?? `Tests terminated by ${result.signal}.`
    );
    break;
  }
}
