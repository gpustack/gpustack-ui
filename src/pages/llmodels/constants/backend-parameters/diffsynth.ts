import { BackendParameter } from './index';

const parameters: BackendParameter[] = [
  {
    label: '--pipeline',
    value: '--pipeline',
    options: [
      'auto',
      'flux',
      'flux2',
      'qwen-image',
      'sd',
      'sdxl',
      'wan-video',
      'z-image'
    ]
  },
  {
    label: '--offload-mode',
    value: '--offload-mode'
  },
  {
    label: '--offload-to-disk',
    value: '--offload-to-disk'
  },
  {
    label: '--encoder-path',
    value: '--encoder-path'
  },
  {
    label: '--vae-path',
    value: '--vae-path'
  },
  {
    label: '--clip-path',
    value: '--clip-path'
  },
  {
    label: '--t5-path',
    value: '--t5-path'
  },
  {
    label: '--image-encoder-path',
    value: '--image-encoder-path'
  }
];

export default parameters;
