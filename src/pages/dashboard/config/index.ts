import { formatLargeNumber } from '@/utils';
import dayjs from 'dayjs';

export const overviewConfigs = [
  {
    key: 'worker_count',
    label: 'dashboard.workers',
    backgroundColor: 'var(--color-white-1)'
  },
  {
    key: 'gpu_count',
    label: 'dashboard.totalgpus',
    backgroundColor: 'var(--color-white-1)'
  },

  {
    key: 'model_count',
    label: 'dashboard.models',
    backgroundColor: 'var(--color-white-1)'
  },
  {
    key: 'model_instance_count',
    label: 'models.form.replicas',
    backgroundColor: 'var(--color-white-1)'
  }
];

export const exportTableColumns = [
  {
    title: 'Date',
    dataIndex: 'date',
    render: (text: string) => {
      return dayjs(text).format('YYYY-MM-DD');
    }
  },
  {
    title: 'User',
    dataIndex: 'user',
    render: (text: string) => {
      return text || 'admin';
    }
  },
  {
    title: 'Model',
    dataIndex: 'model',
    render: (text: string) => {
      return text || 'All Models';
    }
  },

  {
    title: 'Completion Tokens',
    dataIndex: 'completion_tokens',
    render: (text: number) => {
      return formatLargeNumber(text) || 0;
    }
  },
  {
    title: 'Prompt Tokens',
    dataIndex: 'prompt_tokens',
    render: (text: number) => {
      return formatLargeNumber(text) || 0;
    }
  },
  {
    title: 'API Requests',
    dataIndex: 'request_count',
    render: (text: number) => {
      return formatLargeNumber(text) || 0;
    }
  }
];

export const baseColorMap = {
  baseL2: 'rgba(13,171,219,0.8)',
  baseL1: 'rgba(0,34,255,0.8)',
  base: 'rgba(0,85,255,0.8)',
  baseR1: 'rgb(102, 214, 224)',
  baseR2: 'rgba(48,0,255,0.8)',
  baseR3: 'rgba(85,167,255,0.8)'
};
