import { StatusMaps } from '@/config';
import { EditOutlined } from '@ant-design/icons';
import { backendOptionsMap } from './backend-parameters';

export const backendTipsList = [
  {
    title: backendOptionsMap.vllm,
    tips: 'models.form.backend.vllm'
  },
  {
    title: backendOptionsMap.SGLang,
    tips: 'models.form.backend.sglang'
  },
  {
    title: backendOptionsMap.ascendMindie,
    tips: 'models.form.backend.mindie'
  },
  {
    title: backendOptionsMap.voxBox,
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

export const backendLabelMap = {
  [backendOptionsMap.llamaBox]: 'llama-box',
  [backendOptionsMap.vllm]: 'vLLM',
  [backendOptionsMap.voxBox]: 'vox-box',
  [backendOptionsMap.ascendMindie]: 'Ascend MindIE',
  [backendOptionsMap.custom]: 'Custom'
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
  [backendOptionsMap.SGLang]: {
    holder: 'models.form.backend_parameters.sglang.placeholder',
    tooltip: ''
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

export const MyModelsStatusValueMap = {
  Inactive: 'stopped',
  Degrade: 'not_ready',
  Active: 'ready'
};

export const MyModelsStatusMap = {
  [MyModelsStatusValueMap.Inactive]: StatusMaps.inactive,
  [MyModelsStatusValueMap.Degrade]: StatusMaps.error,
  [MyModelsStatusValueMap.Active]: StatusMaps.success
};

export const MyModelsStatusLabelMap = {
  [MyModelsStatusValueMap.Inactive]: 'models.mymodels.status.inactive',
  [MyModelsStatusValueMap.Degrade]: 'models.mymodels.status.degrade',
  [MyModelsStatusValueMap.Active]: 'models.mymodels.status.active'
};

export const ScheduleValueMap = {
  Auto: 'auto',
  Manual: 'manual',
  SpecificGPUType: 'specific_gpu_type'
};

export const scheduleList = [
  {
    label: 'models.form.scheduletype.auto',
    locale: true,
    value: ScheduleValueMap.Auto
  },
  {
    label: 'models.form.scheduletype.manual',
    value: ScheduleValueMap.Manual,
    locale: true
  }
  // {
  //   label: 'models.form.scheduletype.gpuType',
  //   value: ScheduleValueMap.SpecificGPUType,
  //   locale: true
  // }
];

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

export const categoryOptions = [
  {
    label: 'LLM',
    value: modelCategoriesMap.llm
  },
  {
    label: 'Embedding',
    value: modelCategoriesMap.embedding
  },
  {
    label: 'Reranker',
    value: modelCategoriesMap.reranker
  },
  {
    label: 'Image',
    value: modelCategoriesMap.image
  },
  {
    label: 'Text-to-Speech',
    value: modelCategoriesMap.text_to_speech
  },
  {
    label: 'Speech-to-Text',
    value: modelCategoriesMap.speech_to_text
  }
];

export const modelCategories = [
  { label: 'common.options.auto', value: null, locale: true },
  ...categoryOptions
];

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

// do not trigger form check compatibility when these fields change, maybe triggered manually
export const DO_NOT_TRIGGER_CHECK_COMPATIBILITY = [
  'model_scope_model_id',
  'huggingface_repo_id',
  'huggingface_filename',
  'model_scope_file_path',
  'name',
  'description',
  'env',
  'source',
  'cluster_id',
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
  'gpu_selector.gpu_ids',
  'run_command',
  'image_name',
  'extended_kv_cache.enabled',
  'extended_kv_cache.ram_size',
  'speculative_config.enabled',
  'speculative_config.draft_model',
  'max_context_len'
];

// ignore to compare old and new data when these fields change in updating model
export const DO_NOT_NOTIFY_RECREATE = ['categories', 'replicas', 'description'];

export const defaultFormValues = {
  replicas: 1,
  description: '',
  categories: null,
  env: {},
  scheduleType: ScheduleValueMap.Auto,
  placement_strategy: 'spread',
  gpu_ids: null,
  gpu_selector: {},
  worker_selector: {},
  backend_parameters: [],
  backend_version: null
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
      link: 'https://docs.vllm.ai/en/stable/cli/serve.html',
      version: 'v0.8.5'
    };
  }
  if (backend === backendOptionsMap.ascendMindie) {
    return {
      backend: 'Ascend MindIE',
      releases: '',
      link: 'https://docs.gpustack.ai/latest/user-guide/built-in-inference-backends/?h=parameters+reference#parameters-reference_2',
      version: '1.0.0'
    };
  }

  if (backend === backendOptionsMap.SGLang) {
    return {
      backend: 'SGLang',
      releases: '',
      link: 'https://docs.sglang.ai/advanced_features/server_arguments.html',
      version: 'v0.5.4'
    };
  }

  return {
    backend: 'vox-box',
    releases: 'https://github.com/gpustack/vox-box/releases',
    link: '',
    version: 'v0.0.13'
  };
};

export const scheduleTypeTips = [
  {
    title: {
      text: 'models.form.scheduletype.auto',
      locale: true
    },
    tips: 'models.form.scheduletype.auto.tips'
  },
  {
    title: {
      text: 'models.form.scheduletype.manual',
      locale: true
    },
    tips: 'models.form.scheduletype.manual.tips'
  }
];

// transform to enum type
export enum DeployFormKeyMap {
  DEPLOYMENT = 'deployment',
  CATALOG = 'catalog'
}
