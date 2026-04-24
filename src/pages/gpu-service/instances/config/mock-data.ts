import { InstanceStatusValueMap } from '.';
import { ListItem } from './types';

export const mockInstanceData: ListItem[] = [
  {
    id: 1,
    name: 'cuda-dev-01',
    instance_type: 'NVIDIA L4 Small',
    instance_type_id: 1,
    template_id: 1,
    image: 'nvidia/cuda:12.4.1-devel-ubuntu22.04',
    gpu_count: 1,
    replicas: 1,
    storage_mode: 'existing',
    storage_id: 1,
    cluster_id: 1,
    status: InstanceStatusValueMap.Ready,
    endpoint: 'https://cuda-dev-01.example.com',
    description: 'CUDA development workspace',
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-10T10:00:00Z'
  },
  {
    id: 2,
    name: 'training-job-a100',
    instance_type: 'NVIDIA A100 Training',
    instance_type_id: 2,
    template_id: 2,
    image: 'pytorch/pytorch:2.5.1-cuda12.4-cudnn9-devel',
    gpu_count: 4,
    replicas: 1,
    storage_mode: 'existing',
    storage_id: 2,
    cluster_id: 1,
    status: InstanceStatusValueMap.Pending,
    endpoint: 'https://training-job-a100.example.com',
    description: 'PyTorch training environment',
    created_at: '2026-04-02T10:00:00Z',
    updated_at: '2026-04-11T10:00:00Z'
  },
  {
    id: 3,
    name: 'inference-vllm',
    instance_type: 'NVIDIA H100 Inference',
    instance_type_id: 3,
    template_id: 6,
    image: 'vllm/vllm-openai:latest',
    gpu_count: 2,
    replicas: 2,
    storage_mode: 'temporary',
    local_storage_size_gb: 100,
    cluster_id: 1,
    status: InstanceStatusValueMap.Error,
    endpoint: 'http://inference-vllm.example.com',
    description: 'OpenAI-compatible inference service',
    created_at: '2026-04-03T10:00:00Z',
    updated_at: '2026-04-12T10:00:00Z'
  }
];
