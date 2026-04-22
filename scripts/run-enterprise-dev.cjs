const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');

const syncScript = path.resolve(__dirname, './sync-enterprise-config.cjs');

const runNodeScript = (args) => {
  const result = spawnSync(process.execPath, [syncScript, ...args], {
    stdio: 'inherit'
  });

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.error) {
    throw result.error;
  }
};

runNodeScript([]);

const child = spawn('max', ['dev'], {
  env: {
    ...process.env,
    ENABLE_ENTERPRISE: 'true'
  },
  shell: true,
  stdio: 'inherit'
});

let cleaned = false;

const clean = () => {
  if (cleaned) {
    return;
  }
  cleaned = true;
  try {
    runNodeScript(['clean']);
  } catch (error) {
    console.error('Failed to clean enterprise config:', error);
  }
};

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((signal) => {
  process.on(signal, () => {
    forwardSignal(signal);
  });
});

child.on('error', (error) => {
  clean();
  throw error;
});

child.on('exit', (code, signal) => {
  clean();
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
