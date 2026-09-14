import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveRuntimeChoice } from './runtime-choice';

test('a version catalog spec clears a previously selected image and command', () => {
  const previous = {
    image_name: 'custom/sglang:dev',
    backend_version: null,
    run_command: '--model-path {{model_path}}'
  };

  assert.deepEqual(
    { ...previous, ...resolveRuntimeChoice({ backend_version: '0.5.9' }) },
    { image_name: null, backend_version: '0.5.9', run_command: null }
  );
});

test('an image catalog spec clears a previously selected version', () => {
  const previous = { image_name: null, backend_version: '0.5.9' };

  assert.deepEqual(
    {
      ...previous,
      ...resolveRuntimeChoice({ image_name: 'custom/sglang:dev' })
    },
    {
      image_name: 'custom/sglang:dev',
      backend_version: null,
      run_command: null
    }
  );
});

test('a selected runtime and its command take precedence over the default spec', () => {
  assert.deepEqual(
    resolveRuntimeChoice(
      { image_name: 'custom/vllm:dev', run_command: 'vllm serve model' },
      { backend_version: '0.9.2', run_command: 'default command' }
    ),
    {
      image_name: 'custom/vllm:dev',
      backend_version: null,
      run_command: 'vllm serve model'
    }
  );
});
