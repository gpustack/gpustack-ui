import { modelSourceMap, modelTaskMap } from './index';

export const HuggingFaceModels = [
  {
    type: 'stt',
    org: 'funasr',
    name: 'paraformer-zh'
  },
  {
    type: 'stt',
    org: 'funasr',
    name: 'paraformer-zh-streaming'
  },
  {
    type: 'stt',
    org: 'funasr',
    name: 'paraformer-en'
  },
  {
    type: 'stt',
    org: 'funasr',
    name: 'conformer-en'
  },
  {
    type: 'stt',
    org: 'Qwen',
    name: 'Qwen-Audio'
  },
  {
    type: 'stt',
    org: 'Qwen',
    name: 'Qwen-Audio-Chat'
  },
  {
    type: 'stt',
    org: 'FunAudioLLM',
    name: 'SenseVoiceSmall'
  },
  {
    type: 'stt',
    org: 'Systran',
    name: '*'
  },
  {
    type: 'tts',
    org: 'suno',
    name: 'bark'
  },
  {
    type: 'tts',
    org: 'suno',
    name: 'bark-small'
  },
  {
    type: 'tts',
    org: 'FunAudioLLM',
    name: 'CosyVoice-300M-Instruct'
  },
  {
    type: 'tts',
    org: 'FunAudioLLM',
    name: 'CosyVoice-300M-SFT'
  },
  {
    type: 'tts',
    org: 'FunAudioLLM',
    name: 'CosyVoice-300M'
  }
];

export const ModelScopeModels = [
  {
    type: 'stt',
    org: 'iic',
    name: 'SenseVoiceSmall'
  },
  {
    type: 'stt',
    org: 'iic',
    name: 'Whisper-large-v3'
  },
  {
    type: 'stt',
    org: 'iic',
    name: 'Whisper-large-v3-turbo'
  },
  {
    type: 'tts',
    org: 'iic',
    name: 'CosyVoice-300M-Instruct'
  },
  {
    type: 'tts',
    org: 'iic',
    name: 'CosyVoice-300M'
  },
  {
    type: 'tts',
    org: 'iic',
    name: 'CosyVoice-300M-25Hz'
  },
  {
    type: 'tts',
    org: 'iic',
    name: 'CosyVoice-300M-SFT'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-whisper-large-v2'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-whisper-large-v3'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-whisper-small.en'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-whisper-small'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-whisper-medium.en'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-whisper-medium'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-whisper-tiny'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-distil-whisper-large-v3'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-whisper-tiny.en'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-distil-whisper-large-v2'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-whisper-base'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-whisper-base.en'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-distil-whisper-medium.en'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-distil-whisper-small.en'
  },
  {
    type: 'stt',
    org: 'gpustack',
    name: 'faster-whisper-large-v1'
  }
];

const checkModelName = (
  modelName: string,
  item: { type: string; org: string; name: string }
) => {
  let sourceName = `${item.org}/${item.name}`;
  if (item.name === '*') {
    sourceName = `${item.org}`;
  }
  return (
    `${sourceName}`.indexOf(modelName) > -1 ||
    modelName?.indexOf(`${sourceName}`) > -1
  );
};

export const identifyModelTask = (source: string, modelName: string) => {
  let data = null;
  if (source === modelSourceMap.huggingface_value) {
    data = HuggingFaceModels.find((item) => checkModelName(modelName, item));
  }
  if (source === modelSourceMap.modelscope_value) {
    data = ModelScopeModels.find((item) => checkModelName(modelName, item));
  }
  if (data) {
    return modelTaskMap.audio;
  }
  return '';
};
