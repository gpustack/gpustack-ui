const { spawnSync } = require('node:child_process');
const path = require('node:path');

const syncScript = path.resolve(__dirname, './sync-enterprise-config.cjs');

const runNodeScript = (args) => {
  const result = spawnSync(process.execPath, [syncScript, ...args], {
    stdio: 'inherit'
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
};

const runBuild = () =>
  spawnSync('max', ['build'], {
    env: {
      ...process.env,
      ENABLE_ENTERPRISE: 'true'
    },
    shell: true,
    stdio: 'inherit'
  });

let buildResult;

try {
  runNodeScript([]);
  buildResult = runBuild();
} finally {
  try {
    runNodeScript(['clean']);
  } catch (error) {
    console.error('Failed to clean enterprise config:', error);
  }
}

if (buildResult?.error) {
  throw buildResult.error;
}

process.exit(buildResult?.status ?? 0);
