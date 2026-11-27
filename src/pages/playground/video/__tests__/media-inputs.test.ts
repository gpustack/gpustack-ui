import assert from 'node:assert/strict';
import test from 'node:test';
import { buildVideoParameters } from '../media-inputs';

const meta = {
  video: {
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
  }
};

test('text-only requests omit stale reference fields', async () => {
  const image = new File(['image'], 'frame.png', { type: 'image/png' });
  const params = buildVideoParameters(
    {
      model: 'h3',
      task: 't2va',
      referenceImage: image,
      firstFrame: image,
      lastFrame: 'https://example.com/last.png',
      references: [{ type: 'image', source: image }],
      reference_url: 'https://example.com/old.png',
      input_reference: image,
      media_inputs: 'stale',
      conditions: []
    },
    'A city',
    meta
  );
  assert.deepEqual(params, { model: 'h3', task: 't2va', prompt: 'A city' });
});

test('keyframes preserve first/last order and use one manifest for URLs and uploads', () => {
  const last = new File(['last'], 'last.png', { type: 'image/png' });
  const params = buildVideoParameters(
    {
      task: 'fl2va',
      aspectRatio: '16:9',
      size: '1344x768',
      firstFrame: ' https://example.com/first.png ',
      lastFrame: last,
      references: [{ type: 'audio', source: 'https://example.com/old.wav' }]
    },
    'A city',
    meta
  );
  assert.equal(params.media_1, last);
  assert.equal(params.size, '1344x768');
  assert.equal(params.aspectRatio, undefined);
  assert.deepEqual(JSON.parse(params.media_inputs as string), [
    {
      type: 'image',
      role: 'keyframe',
      frame_index: 0,
      uri: 'https://example.com/first.png'
    },
    {
      type: 'image',
      role: 'keyframe',
      frame_index: -1,
      upload_field: 'media_1'
    }
  ]);
  assert.equal(params.references, undefined);
  assert.equal(params.firstFrame, undefined);
});

test('single reference requests omit hidden extra references', () => {
  const image = new File(['image'], 'subject.png', { type: 'image/png' });
  const params = buildVideoParameters(
    {
      task: 'ref2va',
      references: [
        { type: 'image', source: image },
        { type: 'audio', source: 'https://example.com/old.wav' },
        { type: 'video', source: 'https://example.com/old.mp4' }
      ]
    },
    'A city',
    meta
  );
  assert.equal(params.media_0, image);
  assert.equal(params.media_1, undefined);
  assert.deepEqual(JSON.parse(params.media_inputs as string), [
    { type: 'image', role: 'reference', upload_field: 'media_0' }
  ]);
  assert.equal(params.extra_params, undefined);
  assert.equal(params.conditions, undefined);
});

test('video requests omit presentation fields and model-default size, and preserve seed zero', () => {
  assert.deepEqual(
    buildVideoParameters(
      {
        model: 'wan',
        aspectRatio: 'default',
        size: 'default',
        random_seed: false,
        seed: 0,
        width: 832,
        height: 480
      },
      'A city'
    ),
    { model: 'wan', seed: 0, prompt: 'A city' }
  );
  assert.deepEqual(
    buildVideoParameters(
      {
        model: 'wan',
        aspectRatio: 'custom',
        random_seed: false,
        seed: 1234,
        width: 960,
        height: 544
      },
      'A city'
    ),
    { model: 'wan', size: '960x544', seed: 1234, prompt: 'A city' }
  );
  assert.deepEqual(
    buildVideoParameters(
      {
        model: 'wan',
        aspectRatio: '16:9',
        size: '1280x704',
        random_seed: true,
        seed: 456,
        width: 1280,
        height: 704
      },
      'A city'
    ),
    { model: 'wan', size: '1280x704', seed: 456, prompt: 'A city' }
  );
});
