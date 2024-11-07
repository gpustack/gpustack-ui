import { StatusMaps } from '@/config';
import { EditOutlined } from '@ant-design/icons';

export const ollamaModelOptions = [
  {
    label: 'llama3.2',
    value: 'llama3.2',
    name: 'llama3.2',
    id: 'llama3.2',
    tags: ['Tools', '1B', '3B']
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

export const backendOptionsMap = {
  llamaBox: 'llama-box',
  vllm: 'vllm'
};

export const modelSourceMap: Record<string, string> = {
  huggingface: 'Hugging Face',
  ollama_library: 'Ollama Library',
  s3: 'S3',
  huggingface_value: 'huggingface',
  ollama_library_value: 'ollama_library',
  s3_value: 's3',
  modelScope: 'ModelScope',
  modelscope_value: 'model_scope',
  local_path: 'Local Path',
  local_path_value: 'local_path'
};

export const modelSourceValueMap = {
  [modelSourceMap.huggingface_value]: modelSourceMap.huggingface,
  [modelSourceMap.ollama_library_value]: modelSourceMap.ollama_library,
  [modelSourceMap.s3_value]: modelSourceMap.s3,
  [modelSourceMap.modelscope_value]: modelSourceMap.modelScope,
  [modelSourceMap.local_path_value]: modelSourceMap.local_path
};

export const InstanceStatusMap = {
  Initializing: 'initializing',
  Pending: 'pending',
  Running: 'running',
  Scheduled: 'scheduled',
  Error: 'error',
  Downloading: 'downloading',
  Unknown: 'unknown',
  Analyzing: 'analyzing'
};

export const InstanceStatusMapValue = {
  [InstanceStatusMap.Initializing]: 'Initializing',
  [InstanceStatusMap.Pending]: 'Pending',
  [InstanceStatusMap.Running]: 'Running',
  [InstanceStatusMap.Scheduled]: 'Scheduled',
  [InstanceStatusMap.Error]: 'Error',
  [InstanceStatusMap.Downloading]: 'Downloading',
  [InstanceStatusMap.Unknown]: 'Unknown',
  [InstanceStatusMap.Analyzing]: 'Analyzing'
};

export const status: any = {
  [InstanceStatusMap.Running]: StatusMaps.success,
  [InstanceStatusMap.Pending]: StatusMaps.transitioning,
  [InstanceStatusMap.Initializing]: StatusMaps.transitioning,
  [InstanceStatusMap.Scheduled]: StatusMaps.transitioning,
  [InstanceStatusMap.Error]: StatusMaps.error,
  [InstanceStatusMap.Downloading]: StatusMaps.transitioning,
  [InstanceStatusMap.Unknown]: StatusMaps.inactive,
  [InstanceStatusMap.Analyzing]: StatusMaps.transitioning
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
  values: Record<string, any>;
  omits: string[];
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
    values: result,
    omits: omits
  };
};

export const setSourceRepoConfigValue = (
  source: string,
  data: any
): {
  values: Record<string, any>;
  omits: string[];
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
    values: result,
    omits: omits
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

export const getVllmCliArgs = (inputString: string) => {
  const arrayOutput = inputString
    .split(/\s*\[\s*|\s*\]\s*/g) // Split by '[' or ']', removing extra spaces
    .filter((item) => item) // Remove empty items
    .map((item) => item.trim()); // Trim spaces around each item

  const result = arrayOutput.map((item) => {
    const parts = item.split(' ');
    const label = parts[0].trim(); // Remove leading dashes
    const value = parts[0].trim();

    if (parts.length === 1) {
      return { label, value, options: [] };
    } else if (parts.length > 1) {
      const optionPart = parts[1];
      if (optionPart.startsWith('{') && optionPart.endsWith('}')) {
        const options = optionPart
          .slice(1, -1)
          .split(',')
          .map((opt) => opt.trim());
        return { label, value, options };
      }
    }
    return { label, value, options: [] }; // Fallback
  });

  return result;
};
