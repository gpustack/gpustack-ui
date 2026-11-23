import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { GPUDriverMap, registerAddWokerCommandMap } from '../gpu-driver';

const envKey = 'GPUSTACK_KV_TRANSFER_IFNAME';
const renderCommand = (kvTransferIfname?: string) =>
  registerAddWokerCommandMap[GPUDriverMap.NVIDIA]({
    gpu: GPUDriverMap.NVIDIA,
    image: 'gpustack/gpustack:example',
    server: 'https://gpustack.example',
    tag: 'example',
    token: 'fake-token',
    registrationInfo: {
      env: { [envKey]: 'cluster-default', GPUSTACK_TOKEN: 'fake-token' }
    },
    kvTransferIfname
  });

const runCommand = (kvTransferIfname?: string, hasRdmaDevice = false) => {
  const command = renderCommand(kvTransferIfname)
    .trim()
    .replace(/\s+$/gm, '')
    .replace(/\\+$/, '');
  return execFileSync(
    'bash',
    [
      '-c',
      `set -e
function [ {
  case "$*" in
    "-d /dev/infiniband ]") return ${hasRdmaDevice ? 0 : 1} ;;
    *) builtin [ "$@" ;;
  esac
}
sudo() { printf '%s\\0' "$@"; }
${command}`
    ],
    { encoding: 'utf8' }
  )
    .split('\0')
    .slice(0, -1);
};

test('Docker registration preserves an interface list and its original spaces', () => {
  const value = ' ens5f0,  ens6f0 ';
  const args = runCommand(value);
  const environment = `${envKey}=${value}`;
  assert.deepEqual(
    args.filter((arg) => arg.startsWith(envKey + '=')),
    [environment]
  );
  assert.equal(args[args.indexOf(environment) - 1], '-e');
  assert.equal(args[args.indexOf('GPUSTACK_TOKEN=fake-token') - 1], '-e');
  assert.equal(args[args.indexOf('--runtime') + 1], 'nvidia');
});

test('shell metacharacters stay in one literal environment argument', () => {
  const value =
    '"$KV_TRANSFER_TEST_VALUE" $(printf substituted) \'quoted\' \\!\x60';
  const args = runCommand(value);
  const environment = `${envKey}=${value}`;
  assert.deepEqual(
    args.filter((arg) => arg.startsWith(envKey + '=')),
    [environment]
  );
  assert.equal(args[args.indexOf(environment) - 1], '-e');
});

test('an explicit value mounts InfiniBand only when the host has the device directory', () => {
  const value = 'all';
  const withoutDevice = runCommand(value);
  const withDevice = runCommand(value, true);

  assert.ok(!withoutDevice.includes('--device=/dev/infiniband'));
  assert.ok(withDevice.includes('--device=/dev/infiniband'));
  assert.ok(withDevice.includes(`${envKey}=${value}`));
});

test('omitted and blank selections contribute no KV registration arguments', () => {
  for (const value of [undefined, '', ' \t ']) {
    const args = runCommand(value, true);
    assert.ok(!args.some((arg) => arg.startsWith(envKey + '=')));
    assert.ok(!args.includes('--device=/dev/infiniband'));
  }
});
