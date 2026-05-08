import { ListItem } from './types';

export const mockTemplateData: ListItem[] = [
  {
    id: 1,
    name: 'Ubuntu CUDA Dev',
    image: 'nvidia/cuda:12.4.1-devel-ubuntu22.04',
    command: ['/bin/bash'],
    volumeMount: '/workspace',
    resources: {
      cpu: '4',
      ram: '16Gi'
    },
    ports: [
      { protocol: 'tcp', port: 22 },
      { protocol: 'udp', port: 8888 }
    ],
    env: [{ name: 'NVIDIA_VISIBLE_DEVICES', value: 'all' }],
    status: 'enabled',
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-10T10:00:00Z'
  },
  {
    id: 2,
    name: 'PyTorch Training',
    image: 'pytorch/pytorch:2.5.1-cuda12.4-cudnn9-devel',
    command: ['python', 'train.py'],
    volumeMount: '/data',
    resources: {
      cpu: '8',
      ram: '32Gi'
    },
    ports: [{ protocol: 'tcp', port: 6006 }],
    env: [{ name: 'PYTHONUNBUFFERED', value: '1' }],
    status: 'enabled',
    created_at: '2026-04-02T10:00:00Z',
    updated_at: '2026-04-11T10:00:00Z'
  },
  {
    id: 3,
    name: 'ROCm Notebook',
    image: 'rocm/pytorch:latest',
    command: ['jupyter', 'lab', '--ip=0.0.0.0', '--allow-root'],
    volumeMount: '/notebooks',
    resources: {
      cpu: '4',
      ram: '16Gi'
    },
    ports: [{ protocol: 'tcp', port: 8888 }],
    env: [{ name: 'HSA_OVERRIDE_GFX_VERSION', value: '10.3.0' }],
    status: 'enabled',
    created_at: '2026-04-03T10:00:00Z',
    updated_at: '2026-04-12T10:00:00Z'
  },
  {
    id: 4,
    name: 'Ascend MindIE',
    image: 'ascend/mindie:latest',
    command: ['/usr/local/Ascend/mindie/latest/bin/mindieservice_daemon'],
    volumeMount: '/models',
    resources: {
      cpu: '4',
      ram: '16Gi'
    },
    ports: [{ protocol: 'tcp', port: 1025 }],
    env: [{ name: 'ASCEND_VISIBLE_DEVICES', value: '0' }],
    status: 'enabled',
    created_at: '2026-04-04T10:00:00Z',
    updated_at: '2026-04-13T10:00:00Z'
  },
  {
    id: 5,
    name: 'CPU Utility',
    image: 'ubuntu:22.04',
    command: ['sleep', 'infinity'],
    volumeMount: '/mnt/data',
    resources: {
      cpu: '2',
      ram: '4Gi'
    },
    ports: [{ protocol: 'tcp', port: 22 }],
    env: [],
    status: 'disabled',
    created_at: '2026-04-05T10:00:00Z',
    updated_at: '2026-04-14T10:00:00Z'
  },
  {
    id: 6,
    name: 'Inference Server',
    image: 'vllm/vllm-openai:latest',
    command: ['python', '-m', 'vllm.entrypoints.openai.api_server'],
    volumeMount: '/models',
    resources: {
      cpu: '16',
      ram: '64Gi'
    },
    ports: [
      { protocol: 'udp', port: 8000 },
      { protocol: 'tcp', port: 8080 }
    ],
    env: [{ name: 'VLLM_WORKER_MULTIPROC_METHOD', value: 'spawn' }],
    status: 'enabled',
    created_at: '2026-04-06T10:00:00Z',
    updated_at: '2026-04-15T10:00:00Z'
  }
];
