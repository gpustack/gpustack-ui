import type { PDMode } from '../../config/types';
import type { BackendParameter } from './index';
import { generateBackendParameters } from './index';

// CLI references for the executables declared by the PD mode catalog:
// https://github.com/vllm-project/router/blob/main/py_src/vllm_router/router_args.py
// https://github.com/sgl-project/sglang/blob/main/sgl-model-gateway/bindings/python/src/sglang_router/router_args.py
const commonFlags = [
  '--host',
  '--port',
  '--enable-igw',
  '--mini-lb',
  '--worker-startup-timeout-secs',
  '--worker-startup-check-interval',
  '--cache-threshold',
  '--balance-abs-threshold',
  '--balance-rel-threshold',
  '--eviction-interval-secs',
  '--max-tree-size',
  '--max-payload-size',
  '--api-key',
  '--log-dir',
  '--prometheus-host',
  '--prometheus-port',
  '--request-id-headers',
  '--request-timeout-secs',
  '--max-concurrent-requests',
  '--queue-size',
  '--queue-timeout-secs',
  '--rate-limit-tokens-per-second',
  '--cors-allowed-origins',
  '--retry-max-retries',
  '--retry-initial-backoff-ms',
  '--retry-max-backoff-ms',
  '--retry-backoff-multiplier',
  '--retry-jitter-factor',
  '--disable-retries',
  '--cb-failure-threshold',
  '--cb-success-threshold',
  '--cb-timeout-duration-secs',
  '--cb-window-duration-secs',
  '--disable-circuit-breaker',
  '--health-failure-threshold',
  '--health-success-threshold',
  '--health-check-timeout-secs',
  '--health-check-interval-secs',
  '--health-check-endpoint'
];

const vllmPolicies = [
  'random',
  'round_robin',
  'cache_aware',
  'power_of_two',
  'consistent_hash'
];
const sglangPolicies = [
  'random',
  'round_robin',
  'cache_aware',
  'power_of_two',
  'bucket',
  'manual',
  'consistent_hashing',
  'prefix_hash'
];

const flags = (values: string[]): BackendParameter[] =>
  values.map((value) => ({ label: value, value }));

const policies = (options: string[]): BackendParameter[] =>
  ['--policy', '--prefill-policy', '--decode-policy'].map((value) => ({
    label: value,
    value,
    options
  }));

const routerCatalogs = {
  vllm: {
    backend: 'vLLM Router',
    link: 'https://github.com/vllm-project/router/',
    parameters: [
      ...policies(vllmPolicies),
      ...flags(commonFlags),
      ...flags(['--vllm-pd-disaggregation', '--intra-node-data-parallel-size']),
      {
        label: '--kv-connector',
        value: '--kv-connector',
        options: ['nixl', 'mooncake', 'moriio']
      },
      {
        label: '--log-level',
        value: '--log-level',
        options: ['debug', 'info', 'warning', 'error', 'critical']
      }
    ]
  },
  sglang: {
    backend: 'SGLang Router',
    link: 'https://docs.sglang.io/docs/advanced_features/sgl_model_gateway#configuration-reference',
    parameters: [
      ...policies(sglangPolicies),
      ...flags(commonFlags),
      ...flags([
        '--pd-disaggregation',
        '--dp-aware',
        '--bucket-adjust-interval-secs',
        '--max-idle-secs',
        '--json-log',
        '--shutdown-grace-period-secs',
        '--disable-health-check'
      ]),
      {
        label: '--assignment-mode',
        value: '--assignment-mode',
        options: ['random', 'min_load', 'min_group']
      },
      {
        label: '--log-level',
        value: '--log-level',
        options: ['debug', 'info', 'warn', 'error']
      }
    ]
  }
};

export const getRouterParameterConfig = (router: PDMode['router']) => {
  const entrypoint = router?.entrypoint || [];
  let catalog: (typeof routerCatalogs)[keyof typeof routerCatalogs] | undefined;
  if (router?.protocol !== 'user_provided') {
    if (entrypoint[0] === 'vllm-router') {
      catalog = routerCatalogs.vllm;
    } else if (entrypoint.includes('sglang_router.launch_router')) {
      catalog = routerCatalogs.sglang;
    }
  }
  // The recipe's choices describe the shipped router version. Prefer them
  // over upstream choices, which can include policies added in newer releases.
  const parameters = new Map<string, BackendParameter>(
    (catalog?.parameters || []).map((parameter) => [parameter.value, parameter])
  );
  for (const arg of router?.tunable_args || []) {
    parameters.set(arg.flag, {
      label: arg.flag,
      value: arg.flag,
      options: arg.options
    });
  }
  // Peer flags append extra workers and are rejected by managed-router
  // admission. GPUStack supplies them from the group's ready members.
  parameters.delete('--prefill');
  parameters.delete('--decode');
  return {
    backend: catalog?.backend || '',
    link: catalog?.link || '',
    holder: catalog ? 'models.form.backend_parameters.router.placeholder' : '',
    options: generateBackendParameters([...parameters.values()])
  };
};
