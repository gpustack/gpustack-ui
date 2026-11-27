import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adaptVideoRequest,
  adaptVideoRequestForCode,
  type VideoCapabilities
} from '../request-adapter';

const h3Capabilities = (
  request_profile: 'sglang_h3' | 'vllm_omni_h3'
): VideoCapabilities => ({
  family: 'minimax_h3',
  request_profile,
  tasks: ['t2va', 'fl2va', 'ref2va'],
  default_task: 't2va',
  default_size: '768x1344',
  media_inputs: {
    fl2va: { keyframes: true, max_items: 2 },
    ref2va: {
      image: 9,
      video: 3,
      audio: 3,
      max_items: 12,
      requires_visual: true
    }
  }
});

test('adapts common MiniMax H3 text-to-video fields for SGLang and vLLM-Omni', async () => {
  const input = {
    model: 'renamed-h3',
    prompt: 'A city at night',
    size: '720x1280',
    seconds: 4,
    seed: 0
  };

  const sglang = await adaptVideoRequest(input, h3Capabilities('sglang_h3'));
  assert.equal(sglang.prompt, 'A city at night');
  assert.equal(sglang.seed, 0);
  assert.equal(sglang.task, 't2va');
  assert.deepEqual(sglang.target, {
    short_edge: 720,
    aspect_ratio: '9:16',
    duration_seconds: 4
  });
  assert.deepEqual(sglang.conditions, []);

  const vllm = await adaptVideoRequest(input, h3Capabilities('vllm_omni_h3'));
  assert.equal(vllm.prompt, 'A city at night');
  assert.equal(vllm.seed, 0);
  assert.deepEqual(vllm.extra_params, {
    task: 't2va',
    aspect_ratio: '9:16',
    duration: 4
  });
  assert.equal(vllm.extra_body, undefined);
});

test('lowers FL2VA keyframes with uploads into base64 data URIs for both engines', async () => {
  const first = new File(['image'], 'first.png', { type: 'image/png' });
  const input = {
    model: 'h3',
    task: 'fl2va',
    size: '1280x720',
    seconds: '4',
    prompt: 'Smooth transition',
    media_inputs: JSON.stringify([
      {
        type: 'image',
        role: 'keyframe',
        frame_index: 0,
        upload_field: 'media_0'
      },
      {
        type: 'image',
        role: 'keyframe',
        frame_index: -1,
        uri: 'https://example.com/last.png'
      }
    ]),
    media_0: first
  };
  const dataUri = 'data:image/png;base64,aW1hZ2U=';

  const sglang = await adaptVideoRequest(input, h3Capabilities('sglang_h3'));
  assert.equal(sglang.media_inputs, undefined);
  assert.equal(sglang.media_0, undefined);
  assert.deepEqual(sglang.target, {
    short_edge: 720,
    aspect_ratio: '16:9',
    duration_seconds: 4
  });
  assert.deepEqual(sglang.conditions, [
    { type: 'image', role: 'keyframe', frame_index: 0, uri: dataUri },
    {
      type: 'image',
      role: 'keyframe',
      frame_index: -1,
      uri: 'https://example.com/last.png'
    }
  ]);

  const vllm = await adaptVideoRequest(input, h3Capabilities('vllm_omni_h3'));
  assert.equal(vllm.media_inputs, undefined);
  assert.equal(vllm.media_0, undefined);
  assert.deepEqual(vllm.image_reference, [
    { image_url: dataUri },
    { image_url: 'https://example.com/last.png' }
  ]);
  assert.deepEqual(vllm.extra_params, {
    task: 'fl2va',
    frame_indices: [0, -1],
    aspect_ratio: '16:9',
    duration: 4
  });
});

test('lowers Ref2VA uploads and preserves explicit overrides while rejecting conflicts', async () => {
  const video = new File(['video-bytes'], 'clip.mp4', { type: 'video/mp4' });
  const refInput = {
    model: 'h3',
    task: 'ref2va',
    prompt: 'Keep motion',
    media_inputs: JSON.stringify([
      { type: 'video', role: 'reference', upload_field: 'media_0' }
    ]),
    media_0: video
  };
  const vllm = await adaptVideoRequest(
    refInput,
    h3Capabilities('vllm_omni_h3')
  );
  assert.deepEqual(vllm.video_reference, [
    { video_url: 'data:video/mp4;base64,dmlkZW8tYnl0ZXM=' }
  ]);

  const target = { short_edge: 480, aspect_ratio: '16:9', duration_seconds: 5 };
  const preserved = await adaptVideoRequest(
    {
      size: '720x1280',
      seconds: 4,
      extra_body: JSON.stringify({ task: 't2va', target })
    },
    h3Capabilities('sglang_h3')
  );
  assert.deepEqual(preserved.target, target);

  for (const seconds of [0, 3, 4.5, 16, true, 'NaN']) {
    await assert.rejects(
      () => adaptVideoRequest({ seconds }, h3Capabilities('sglang_h3')),
      /seconds must be between/
    );
  }
  await assert.rejects(
    () =>
      adaptVideoRequest(
        { task: 't2va', extra_body: '{"task":"fl2va"}' },
        h3Capabilities('sglang_h3')
      ),
    /Conflicting/
  );
  await assert.rejects(
    () =>
      adaptVideoRequest(
        { task: 't2va', input_reference: new File(['x'], 'x.png') },
        h3Capabilities('sglang_h3')
      ),
    /text only/
  );
});

test('leaves non-H3 video models untouched and produces placeholders for code preview', async () => {
  const input = {
    model: 'wan',
    prompt: 'A city',
    input_reference: new File(['image'], 'ref.png', { type: 'image/png' })
  };
  assert.equal(await adaptVideoRequest(input, undefined), input);
  assert.deepEqual(adaptVideoRequestForCode(input, undefined), {
    parameters: input,
    inlineMedia: []
  });

  const keyframe = new File(['image'], 'first.png', { type: 'image/png' });
  const codeReady = adaptVideoRequestForCode(
    {
      model: 'h3',
      task: 'fl2va',
      prompt: 'Animate',
      size: '1280x720',
      seconds: 4,
      media_inputs: JSON.stringify([
        {
          type: 'image',
          role: 'keyframe',
          frame_index: 0,
          upload_field: 'media_0'
        }
      ]),
      media_0: keyframe
    },
    h3Capabilities('sglang_h3')
  );
  assert.equal(codeReady.inlineMedia.length, 1);
  assert.equal(codeReady.inlineMedia[0].env, 'MEDIA_0_PATH');
  assert.equal(codeReady.parameters.media_inputs, undefined);
  assert.deepEqual(codeReady.parameters.conditions, [
    {
      type: 'image',
      role: 'keyframe',
      frame_index: 0,
      uri: codeReady.inlineMedia[0].placeholder
    }
  ]);
});
