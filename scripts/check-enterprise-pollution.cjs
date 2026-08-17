const { execSync } = require('node:child_process');

// The enterprise build (`dev:enterprise` / `build:enterprise`, run from the
// gpustack-ui-enterprise workspace root) injects its plugin loader and its seam
// implementations into six of this repo's tracked files, then reverts them when it
// exits. Its cleanup covers a normal exit and SIGINT/SIGTERM/SIGHUP — but not
// SIGKILL, a force-quit or a power loss. What survives that is enterprise code
// sitting in the open-source tree, and committing it here would leak it.
//
// Recover by running this from the workspace root, then re-staging:
//
//   npm run sync:enterprise-config:clean
const GUARDED_FILES = [
  'src/global.tsx',
  'package.json',
  'config/routes.extensions.ts',
  'config/mfsu.extensions.ts',
  'src/access.extensions.ts',
  'src/request.extensions.ts'
];

// Both are unambiguous: the sentinel the sync script wraps its injection in, and
// any mention of the enterprise package at all. Neither appears anywhere in a
// clean checkout, so there is nothing legitimate to whitelist.
const MARKERS = ['ENTERPRISE_PLUGIN_BLOCK_START', 'gpustack-ui-enterprise'];

const run = (command) => execSync(command, { encoding: 'utf8' });

const stagedFiles = new Set(
  run('git diff --cached --name-only --diff-filter=ACM').split('\n').filter(Boolean)
);

const offenders = [];

for (const file of GUARDED_FILES) {
  if (!stagedFiles.has(file)) {
    continue;
  }
  // Read the staged blob rather than the working tree: that is what the commit
  // would actually record, and the two can differ.
  const staged = run(`git show :${file}`);
  const found = MARKERS.filter((marker) => staged.includes(marker));
  if (found.length) {
    offenders.push({ file, found });
  }
}

if (offenders.length) {
  console.error('\n✖ Enterprise build artefacts are staged:\n');
  for (const { file, found } of offenders) {
    console.error(`    ${file}  →  contains ${found.join(', ')}`);
  }
  console.error(
    '\n  This repository is open source; the enterprise plugin injection must\n' +
      '  never be committed here. It is left behind when an enterprise dev or\n' +
      '  build run is killed before its cleanup step.\n\n' +
      '  Run this from the gpustack-ui-enterprise workspace root, then re-stage:\n\n' +
      '      npm run sync:enterprise-config:clean\n'
  );
  process.exit(1);
}
