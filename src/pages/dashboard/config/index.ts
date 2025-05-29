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
