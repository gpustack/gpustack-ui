import { StatusMaps } from '@/config';
import { EditOutlined } from '@ant-design/icons';
import _ from 'lodash';

export const ollamaModelOptions = [
  {
    label: 'qwen2.5-coder',
    value: 'qwen2.5-coder',
    name: 'qwen2.5-coder',
    id: 'qwen2.5-coder',
    tags: []
  },
  {
    label: 'llama3.2',
    value: 'llama3.2',
    name: 'llama3.2',
    id: 'llama3.2',
    tags: ['Tools', '1B', '3B']
  },
  {
    label: 'nomic-embed-text',
    value: 'nomic-embed-text',
    name: 'nomic-embed-text',
    id: 'nomic-embed-text',
    tags: []
  },
  {
    label: 'qwen2.5',
    value: 'qwen2.5',
    name: 'qwen2.5',
    tags: ['Tools', '0.5B', '1.5B', '3B', '7B', '14B', '32B', '72B'],
    id: 'gemma2'
  },
  {
    label: 'gemma2',
    value: 'gemma2',
    name: 'gemma2',
    tags: ['2B', '9B', '27B'],
    id: 'gemma2'
  },
  {
    label: 'mistral-nemo',
    value: 'mistral-nemo',
    name: 'mistral-nemo',
    tags: ['12B'],
    id: 'mistral-nemo'
  },
  {
    label: 'mistral-large',
    value: 'mistral-large',
    name: 'mistral-large',
    tags: ['123B'],
    id: 'mistral-large'
  },
  {
    label: 'mistral',
    value: 'mistral',
    name: 'mistral',
    tags: ['7B'],
    id: 'mistral'
  },
  {
    label: 'phi3.5',
    value: 'phi3.5',
    name: 'phi3.5',
    tags: ['3B'],
    id: 'phi3.5'
  },
  {
    label: 'codellama',
    value: 'codellama',
    name: 'codellama',
    tags: ['7B', '13B', '34B', '70B'],
    id: 'codellama'
  },
  {
    label: 'deepseek-coder-v2',
    value: 'deepseek-coder-v2',
    name: 'deepseek-coder-v2',
    tags: ['16B', '236B'],
    id: 'deepseek-coder-v2'
  }
];

export const backendTipsList = [
  {
    title: 'llama-box',
    tips: 'models.form.backend.llamabox'
  },
  {
    title: 'vLLM',
    tips: 'models.form.backend.vllm'
  },
  {
    title: 'Ascend MindIE',
    tips: 'models.form.backend.mindie'
  },
  {
    title: 'vox-box',
    tips: 'models.form.backend.voxbox'
  }
];

export const localPathTipsList = [
  {
    title: {
      text: 'models.localpath.gguf.tips.title',
      locale: true
    },
    tips: 'models.localpath.gguf.tips'
  },
  {
    title: {
      text: 'models.localpath.shared.tips.title',
      locale: true
    },
    tips: 'models.localpath.chunks.tips'
  },
  {
    title: {
      text: 'models.localpat.safe.tips.title',
      locale: true
    },
    tips: 'models.localpath.safe.tips'
  }
];

export const backendOptionsMap = {
  llamaBox: 'llama-box',
  vllm: 'vllm',
  voxBox: 'vox-box',
  ascendMindie: 'ascend-mindie'
};

export const backendLabelMap = {
  [backendOptionsMap.llamaBox]: 'llama-box',
  [backendOptionsMap.vllm]: 'vLLM',
  [backendOptionsMap.voxBox]: 'vox-box',
  [backendOptionsMap.ascendMindie]: 'Ascend MindIE'
};

export const backendParamsHolderTips = {
  [backendOptionsMap.llamaBox]: {
    holder: 'models.form.backend_parameters.llamabox.placeholder',
    tooltip: 'models.form.backend_parameters.vllm.tips'
  },
  [backendOptionsMap.vllm]: {
    holder: 'models.form.backend_parameters.vllm.placeholder',
    tooltip: 'models.form.backend_parameters.vllm.tips'
  },
  [backendOptionsMap.voxBox]: null
};

export const modelTaskMap = {
  textToSpeech: 'text-to-speech',
  speechToText: 'speech-to-text',
  textToText: 'text-to-text',
  textToImage: 'text-to-image',
  audio: 'audio',
  image: 'image'
};

export const ModelscopeTaskMap = {
  [modelTaskMap.textToSpeech]: 'text-to-speech',
  [modelTaskMap.speechToText]: 'auto-speech-recognition',
  [modelTaskMap.textToText]: 'TextToText',
  [modelTaskMap.textToImage]: 'text-to-image',
  audio: ['text-to-speech', 'auto-speech-recognition']
};

export const HuggingFaceTaskMap = {
  [modelTaskMap.textToSpeech]: 'text-to-speech',
  [modelTaskMap.speechToText]: 'automatic-speech-recognition',
  [modelTaskMap.textToText]: 'text-2-text',
  [modelTaskMap.textToImage]: 'text-to-image',
  audio: ['text-to-speech', 'automatic-speech-recognition']
};

export const AudioModeTypeMap = {
  FunASR: ['FunASR', 'funasr', 'fun-asr', 'fun_asr'],
  Bark: ['Bark', 'bark'],
  Whisper: ['Whisper', 'whisper'],
  CosyVoice: ['CosyVoice', 'cosyvoice', 'cosy-voice', 'cosy_voice']
};
interface ModelSource {
  huggingface: string;
  huggingface_value: string;
  ollama_library: string;
  ollama_library_value: string;
  modelScope: string;
  modelscope_value: string;
  local_path: string;
  local_path_value: string;
  model_scope: string;
}

export const modelSourceMap: ModelSource = {
  huggingface: 'Hugging Face',
  huggingface_value: 'huggingface',
  ollama_library: 'Ollama Library',
  ollama_library_value: 'ollama_library',
  modelScope: 'ModelScope',
  modelscope_value: 'model_scope',
  model_scope: 'ModelScope',
  local_path: 'Local Path',
  local_path_value: 'local_path'
};

export const modelSourceValueMap = {
  [modelSourceMap.huggingface_value]: modelSourceMap.huggingface,
  [modelSourceMap.ollama_library_value]: modelSourceMap.ollama_library,
  [modelSourceMap.modelscope_value]: modelSourceMap.modelScope,
  [modelSourceMap.local_path_value]: modelSourceMap.local_path
};

export const sourceOptions = [
  {
    label: 'Hugging Face',
    value: modelSourceMap.huggingface_value,
    key: 'huggingface'
  },
  {
    label: 'Ollama Library',
    value: modelSourceMap.ollama_library_value,
    key: 'ollama_library'
  },
  {
    label: 'ModelScope',
    value: modelSourceMap.modelscope_value,
    key: 'model_scope'
  },
  {
    label: 'models.form.localPath',
    locale: true,
    value: modelSourceMap.local_path_value,
    key: 'local_path'
  }
];

export const InstanceStatusMap = {
  Initializing: 'initializing',
  Starting: 'starting',
  Pending: 'pending',
  Running: 'running',
  Scheduled: 'scheduled',
  Error: 'error',
  Downloading: 'downloading',
  Unknown: 'unknown',
  Analyzing: 'analyzing',
  Unreachable: 'unreachable'
};

export const InstanceRealtimeLogStatus = [
  InstanceStatusMap.Downloading,
  InstanceStatusMap.Initializing,
  InstanceStatusMap.Starting
];

export const InstanceStatusMapValue = {
  [InstanceStatusMap.Initializing]: 'Initializing',
  [InstanceStatusMap.Pending]: 'Pending',
  [InstanceStatusMap.Running]: 'Running',
  [InstanceStatusMap.Scheduled]: 'Scheduled',
  [InstanceStatusMap.Error]: 'Error',
  [InstanceStatusMap.Downloading]: 'Downloading',
  [InstanceStatusMap.Unknown]: 'Unknown',
  [InstanceStatusMap.Analyzing]: 'Analyzing',
  [InstanceStatusMap.Starting]: 'Starting',
  [InstanceStatusMap.Unreachable]: 'Unreachable'
};

export const status: any = {
  [InstanceStatusMap.Running]: StatusMaps.success,
  [InstanceStatusMap.Pending]: StatusMaps.transitioning,
  [InstanceStatusMap.Initializing]: StatusMaps.transitioning,
  [InstanceStatusMap.Scheduled]: StatusMaps.transitioning,
  [InstanceStatusMap.Error]: StatusMaps.error,
  [InstanceStatusMap.Downloading]: StatusMaps.transitioning,
  [InstanceStatusMap.Unknown]: StatusMaps.inactive,
  [InstanceStatusMap.Analyzing]: StatusMaps.transitioning,
  [InstanceStatusMap.Starting]: StatusMaps.transitioning,
  [InstanceStatusMap.Unreachable]: StatusMaps.error
};

export const ActionList = [
  {
    label: 'common.button.edit',
    key: 'edit',
    icon: EditOutlined
  },
  {
    label: 'models.openinplayground',
    key: 'chat',
    icon: EditOutlined
  },
  {
    label: 'common.button.delete',
    key: 'delete',
    icon: EditOutlined
  }
];

export const ModelSortType = {
  trendingScore: 'trendingScore',
  likes: 'likes',
  downloads: 'downloads',
  lastModified: 'lastModified'
};

export const ModelScopeSortType = {
  [ModelSortType.trendingScore]: 'Default',
  [ModelSortType.likes]: 'StarsCount',
  [ModelSortType.downloads]: 'DownloadsCount',
  [ModelSortType.lastModified]: 'GmtModified'
};

export const placementStrategyOptions = [
  {
    label: 'Spread',
    value: 'spread'
  },
  {
    label: 'Binpack',
    value: 'binpack'
  }
];

export const modelCategoriesMap = {
  image: 'image',
  text_to_speech: 'text_to_speech',
  speech_to_text: 'speech_to_text',
  embedding: 'embedding',
  reranker: 'reranker',
  llm: 'llm'
};

export const modelCategories = [
  { label: 'common.options.auto', value: null, locale: true },
  { label: 'LLM', value: modelCategoriesMap.llm },
  { label: 'Image', value: modelCategoriesMap.image },
  { label: 'Text-to-Speech', value: modelCategoriesMap.text_to_speech },
  { label: 'Speech-to-Text', value: modelCategoriesMap.speech_to_text },
  { label: 'Embedding', value: modelCategoriesMap.embedding },
  { label: 'Reranker', value: modelCategoriesMap.reranker }
];

export const sourceRepoConfig = {
  [modelSourceMap.huggingface_value]: {
    repo_id: 'huggingface_repo_id',
    file_name: 'huggingface_filename'
  },

  [modelSourceMap.modelscope_value]: {
    repo_id: 'model_scope_model_id',
    file_name: 'model_scope_file_path'
  }
};

export const getSourceRepoConfigValue = (
  source: string,
  data: any
): {
  values: typeof data;
} => {
  const config: Record<string, any> = sourceRepoConfig[source] || {};
  const result: Record<string, any> = {};
  const omits: string[] = [];
  Object.keys(config)?.forEach((key: string) => {
    if (config[key]) {
      result[config[key]] = data[key];
      omits.push(key);
    }
  });
  return {
    values: { ...result, ..._.omit(data, omits) }
  };
};

export const setSourceRepoConfigValue = (
  source: string,
  data: any
): {
  values: Record<string, any>;
} => {
  const config: Record<string, any> = sourceRepoConfig[source] || {};
  const result: Record<string, any> = {};
  const omits: string[] = [];
  Object.keys(config)?.forEach((key: string) => {
    if (config[key]) {
      result[key] = data[config[key]];
      omits.push(config[key]);
    }
  });

  return {
    values: { ...result, ..._.omit(data, omits) }
  };
};

export const getbackendParameters = (data: any) => {
  const backendParameters = data.backend_parameters || {};
  const result: string[] = [];
  Object.keys(backendParameters)?.forEach((key: string) => {
    result.push(`${key}=${backendParameters[key]}`);
  });
  return result;
};

export const setbackendParameters = (data: any) => {
  const result: Record<string, string> = {};
  const backendParameters = data.backend_parameters || [];
  backendParameters.forEach((item: string) => {
    const [key, value] = item.split('=');
    result[key] = value;
  });
  return result;
};

export const modelLabels = [
  { label: 'Image', value: 'image_only' },
  { label: 'Text-to-speech', value: 'text_to_speech' },
  { label: 'Speech-to-text', value: 'speech_to_text' },
  { label: 'reranker', value: 'reranker' },
  { label: 'Embedding', value: 'embedding_only' }
];

// do not trigger form check compatibility
export const excludeFields = [
  'repo_id',
  'file_name',
  'replicas',
  'name',
  'description',
  'env',
  'source',
  'quantization',
  'size',
  'restart_on_error',
  'worker_selector',
  'backend_parameters',
  'local_path',
  'backend_version',
  'ollama_library_model_name',
  'scheduleType',
  'placement_strategy',
  'backend',
  'gpu_selector'
];

// ingore fields when compare old and new data
export const updateIgnoreFields = ['categories', 'replicas', 'description'];

// if some fields need to trigger manual check, add them here
export const updateExcludeFields = [
  'repo_id',
  'file_name',
  'description',
  'source',
  'worker_selector',
  'backend_parameters',
  'local_path',
  'backend_version',
  'ollama_library_model_name',
  'backend',
  'gpu_selector',
  'categories',
  'env',
  'replicas'
];

export const formFields = [
  'name',
  'repo_id',
  'file_name',
  'local_path',
  'ollama_library_model_name',
  'backend',
  'replicas',
  'source',
  'description',
  'worker_selector',
  'cpu_offloading',
  'distributed_inference_across_workers',
  'gpu_selector',
  'gpu_ids',
  'categories',
  'backend_version',
  'env',
  'scheduleType',
  'restart_on_error'
];

export const defaultFormValues = {
  replicas: 1,
  description: '',
  categories: null,
  env: {},
  scheduleType: 'auto',
  placement_strategy: 'spread',
  gpu_ids: null,
  gpu_selector: {},
  worker_selector: {},
  backend_parameters: [],
  backend_version: ''
};

export const getBackendParamsTips = (backend: string) => {
  if (backend === backendOptionsMap.llamaBox) {
    return {
      backend: 'llama-box',
      releases: 'https://github.com/gpustack/llama-box/releases',
      link: 'https://github.com/gpustack/llama-box?tab=readme-ov-file#usage',
      version: 'v0.0.140'
    };
  }
  if (backend === backendOptionsMap.vllm) {
    return {
      backend: 'vLLM',
      releases: 'https://github.com/vllm-project/vllm/releases',
      link: 'https://docs.vllm.ai/en/latest/configuration/engine_args.html',
      version: 'v0.8.5'
    };
  }
  if (backend === backendOptionsMap.ascendMindie) {
    return {
      backend: 'Ascend MindIE',
      releases: '',
      link: 'http://docs.gpustack.ai/latest/user-guide/inference-backends/#parameters-reference_2',
      version: '1.0.0'
    };
  }

  return {
    backend: 'vox-box',
    releases: 'https://github.com/gpustack/vox-box/releases',
    link: '',
    version: 'v0.0.13'
  };
};
