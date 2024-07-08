import { StatusMaps } from '@/config';
import { EditOutlined } from '@ant-design/icons';

export const ollamaModelOptions = [
  { label: 'llama3', value: 'llama3' },
  { label: 'gemma', value: 'gemma' },
  { label: 'mistral', value: 'mistral' },
  { label: 'qwen', value: 'qwen' },
  { label: 'llama2', value: 'llama2' },
  { label: 'phi3', value: 'phi3' },
  { label: 'codellama', value: 'codellama' },
  { label: 'deepseek-coder', value: 'deepseek-coder' }
];

export const modelSourceMap: Record<string, string> = {
  huggingface: 'Hugging Face',
  ollama_library: 'Ollama Library',
  s3: 'S3'
};

export const InstanceStatusMap = {
  Initializing: 'Initializing',
  Pending: 'Pending',
  Running: 'Running',
  Scheduled: 'Scheduled',
  Error: 'Error',
  Downloading: 'Downloading',
  Unknown: 'Unknown'
};

export const status: any = {
  [InstanceStatusMap.Running]: StatusMaps.success,
  [InstanceStatusMap.Pending]: StatusMaps.transitioning,
  [InstanceStatusMap.Initializing]: StatusMaps.transitioning,
  [InstanceStatusMap.Scheduled]: StatusMaps.success,
  [InstanceStatusMap.Error]: StatusMaps.error,
  [InstanceStatusMap.Downloading]: StatusMaps.transitioning,
  [InstanceStatusMap.Unknown]: StatusMaps.inactive
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
