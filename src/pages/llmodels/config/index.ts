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

export const modelSourceMap = {
  huggingface: 'huggingface',
  ollama_library: 'ollama_library',
  s3: 's3'
};

export const status: any = {
  Running: StatusMaps.success
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
