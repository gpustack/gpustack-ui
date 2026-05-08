import { InstanceStatusValueMap } from '.';
import { ListItem } from './types';

export const mockInstanceData: (ListItem & { cluster_id: number })[] = [
  {
    id: 1,
    cluster_id: 1,
    metadata: {
      name: 'cuda-dev-01',
      namespace: 'default'
    },
    spec: {
      type: 'nvidia-l4-small',
      image: 'nvidia/cuda:12.4.1-devel-ubuntu22.04',
      displayName: 'CUDA Dev 01',
      command: ['/bin/bash'],
      ports: [{ protocol: 'tcp', port: 22 }],
      env: [],
      volumeMount: '/workspace',
      resources: {
        cpu: '4',
        ram: '16Gi',
        accelerator: '1'
      },
      description: 'CUDA development workspace',
      volume: {
        persistent: { name: 'local-nvme-cache' }
      },
      sshPublicKey: { name: 'default' }
    },
    status: InstanceStatusValueMap.Ready,
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-10T10:00:00Z'
  },
  {
    id: 2,
    cluster_id: 1,
    metadata: {
      name: 'training-job-a100',
      namespace: 'default'
    },
    spec: {
      type: 'nvidia-a100-training',
      image: 'pytorch/pytorch:2.5.1-cuda12.4-cudnn9-devel',
      displayName: 'Training A100',
      command: ['python', 'train.py'],
      ports: [],
      env: [{ name: 'PYTHONUNBUFFERED', value: '1' }],
      volumeMount: '/data',
      resources: {
        cpu: '32',
        ram: '128Gi',
        accelerator: '4'
      },
      description: 'PyTorch training environment',
      volume: {
        persistent: { name: 'shared-model-store' }
      },
      sshPublicKey: { name: '' }
    },
    status: InstanceStatusValueMap.Pending,
    created_at: '2026-04-02T10:00:00Z',
    updated_at: '2026-04-11T10:00:00Z'
  },
  {
    id: 3,
    cluster_id: 1,
    metadata: {
      name: 'inference-vllm',
      namespace: 'default'
    },
    spec: {
      type: 'nvidia-h100-inference',
      image: 'vllm/vllm-openai:latest',
      displayName: 'Inference vLLM',
      command: ['python', '-m', 'vllm.entrypoints.openai.api_server'],
      ports: [{ protocol: 'tcp', port: 8080 }],
      env: [{ name: 'VLLM_WORKER_MULTIPROC_METHOD', value: 'spawn' }],
      volumeMount: '/models',
      resources: {
        cpu: '16',
        ram: '64Gi',
        accelerator: '2'
      },
      description: 'OpenAI-compatible inference service',
      volume: {
        ephemeral: { capacity: '100Gi' }
      },
      sshPublicKey: { name: '' }
    },
    status: InstanceStatusValueMap.Error,
    created_at: '2026-04-03T10:00:00Z',
    updated_at: '2026-04-12T10:00:00Z'
  }
];
