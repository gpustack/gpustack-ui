const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const pnpmDir = path.resolve(__dirname, '../../../node_modules/.pnpm');

function findDir(prefix) {
  return fs.readdirSync(pnpmDir).find((name) => name.startsWith(prefix));
}

const stylelintDir = findDir('stylelint@14.8.2');
if (!stylelintDir) {
  console.error('Compatible stylelint@14.8.2 not found in workspace node_modules/.pnpm');
  process.exit(1);
}

const stylelintBin = path.join(
  pnpmDir,
  stylelintDir,
  'node_modules/stylelint/bin/stylelint.js'
);

const result = spawnSync(process.execPath, [stylelintBin, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

if (result.error) {
  console.error(result.error);
}

process.exit(result.status ?? 1);
