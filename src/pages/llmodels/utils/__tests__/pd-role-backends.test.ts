import assert from 'node:assert/strict';
import test from 'node:test';
import type { PDModeResolution } from '../../config/types';
import { intersectPDResolutions } from '../pd-role-backends';

const resolution = (engine: string): PDModeResolution => ({
  mode: engine === 'vLLM' ? 'vllm-nixl' : 'sglang-mooncake',
  vendor: 'nvidia',
  candidate_vendors: ['nvidia'],
  cluster_vendors: ['nvidia'],
  options: [
    {
      name: 'vllm-nixl',
      eligible: engine === 'vLLM',
      recommended: engine === 'vLLM'
    },
    {
      name: 'sglang-mooncake',
      eligible: engine === 'SGLang',
      recommended: engine === 'SGLang'
    },
    { name: 'custom', eligible: true, recommended: false }
  ]
});

test('mixed engine recommendations retain only common eligible recipes', () => {
  const result = intersectPDResolutions([
    resolution('vLLM'),
    resolution('SGLang')
  ]);
  assert.equal(result.mode, null);
  assert.deepEqual(
    result.options
      .filter((option) => option.eligible)
      .map((option) => option.name),
    ['custom']
  );
});

test('partial verdict sets delegate to catalog checks instead of accepting one engine alone', () => {
  const responses = [resolution('vLLM'), resolution('SGLang')].map(
    (result) => ({
      ...result,
      options: result.options.filter((option) => option.eligible)
    })
  );
  const result = intersectPDResolutions(responses);
  assert.equal(result.mode, null);
  assert.deepEqual(result.options, []);
});
