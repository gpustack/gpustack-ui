import { SizeOption } from './params-config';
import { ParamsSchema } from './types';

export const VIDEO_DEFAULT_SECONDS = 4;
export const VIDEO_MAX_SECONDS = 3600;

export const videoTaskLabels: Record<string, string> = {
  t2va: 'playground.video.task.t2va',
  fl2va: 'playground.video.task.fl2va',
  ref2va: 'playground.video.task.ref2va'
};

export const videoAspectRatios = [
  { label: '9:16', width: 9, height: 16 },
  { label: '16:9', width: 16, height: 9 },
  { label: '1:1', width: 1, height: 1 },
  { label: '4:3', width: 4, height: 3 },
  { label: '3:4', width: 3, height: 4 }
];

export const formatVideoSizeLabel = (width: number, height: number) => {
  const shortEdge = Math.min(width, height);
  return `${shortEdge === 2160 ? '4k' : `${shortEdge}p`} (${width} × ${height})`;
};

export const videoSizeOptions: SizeOption[] = [
  [480, 832],
  [704, 1280],
  [720, 1280],
  [768, 1344],
  [832, 480],
  [1280, 704],
  [1280, 720],
  [1344, 768],
  [768, 768],
  [1024, 768],
  [768, 1024],
  [1920, 1080],
  [1080, 1920],
  [1080, 1080],
  [1440, 1080],
  [1080, 1440],
  [3840, 2160],
  [2160, 3840],
  [2160, 2160],
  [2880, 2160],
  [2160, 2880]
].map(([width, height]) => ({
  label: formatVideoSizeLabel(width, height),
  value: `${width}x${height}`,
  width,
  height
}));

export const videoAspectRatioOptions = [
  ...videoAspectRatios.map(({ label }) => ({ label, value: label })),
  { label: 'playground.params.custom', value: 'custom', locale: true }
];

export const videoParamsConfig: ParamsSchema[] = [
  {
    type: 'InputNumber',
    name: 'seconds',
    label: {
      text: 'playground.params.duration',
      isLocalized: true
    },
    rules: []
  },
  {
    type: 'Select',
    name: 'aspectRatio',
    options: videoAspectRatioOptions,
    label: {
      text: 'playground.params.aspectRatio',
      isLocalized: true
    },
    rules: [{ required: true }]
  },
  {
    type: 'Select',
    name: 'size',
    options: videoSizeOptions,
    label: {
      text: 'playground.params.resolution',
      isLocalized: true
    },
    rules: [
      {
        required: false
      }
    ]
  }
];
