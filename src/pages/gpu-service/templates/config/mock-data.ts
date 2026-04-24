import { ListItem } from './types';

export const mockTemplateData: ListItem[] = [
  {
    id: 1,
    name: 'Ubuntu CUDA Dev',
    image: 'nvidia/cuda:12.4.1-devel-ubuntu22.04',
    vendor: 'cuda',
    run_command: '/bin/bash',
    boot_disk_size_gb: 30,
    volume_size_gb: 100,
    volume_mount_path: '/workspace',
    ports: [
      {
        protocol: 'tcp',
        value: 22
      },
      {
        protocol: 'udp',
        value: 8888
      }
    ],
    env: {
      NVIDIA_VISIBLE_DEVICES: 'all'
    },
    gpu_count: 1,
    replicas: 1,
    status: 'enabled',
    created_at: '2026-04-01T10:00:00Z',
    updated_at: '2026-04-10T10:00:00Z'
  },
  {
    id: 2,
    name: 'PyTorch Training',
    image: 'pytorch/pytorch:2.5.1-cuda12.4-cudnn9-devel',
    vendor: 'cuda',
    run_command: 'python train.py',
    boot_disk_size_gb: 50,
    volume_size_gb: 200,
    volume_mount_path: '/data',
    ports: [
      {
        protocol: 'tcp',
        value: 6006
      }
    ],
    env: {
      PYTHONUNBUFFERED: '1'
    },
    gpu_count: 2,
    replicas: 1,
    status: 'enabled',
    created_at: '2026-04-02T10:00:00Z',
    updated_at: '2026-04-11T10:00:00Z'
  },
  {
    id: 3,
    name: 'ROCm Notebook',
    image: 'rocm/pytorch:latest',
    vendor: 'rocm',
    run_command: 'jupyter lab --ip=0.0.0.0 --allow-root',
    boot_disk_size_gb: 40,
    volume_size_gb: 120,
    volume_mount_path: '/notebooks',
    ports: [
      {
        protocol: 'http',
        value: 8888
      }
    ],
    env: {
      HSA_OVERRIDE_GFX_VERSION: '10.3.0'
    },
    gpu_count: 1,
    replicas: 1,
    status: 'enabled',
    created_at: '2026-04-03T10:00:00Z',
    updated_at: '2026-04-12T10:00:00Z'
  },
  {
    id: 4,
    name: 'Ascend MindIE',
    image: 'ascend/mindie:latest',
    vendor: 'cann',
    run_command: '/usr/local/Ascend/mindie/latest/bin/mindieservice_daemon',
    boot_disk_size_gb: 60,
    volume_size_gb: 160,
    volume_mount_path: '/models',
    ports: [
      {
        protocol: 'http',
        value: 1025
      }
    ],
    env: {
      ASCEND_VISIBLE_DEVICES: '0'
    },
    gpu_count: 1,
    replicas: 1,
    status: 'enabled',
    created_at: '2026-04-04T10:00:00Z',
    updated_at: '2026-04-13T10:00:00Z'
  },
  {
    id: 5,
    name: 'CPU Utility',
    image: 'ubuntu:22.04',
    vendor: 'cuda',
    run_command: 'sleep infinity',
    boot_disk_size_gb: 20,
    volume_size_gb: 50,
    volume_mount_path: '/mnt/data',
    ports: [
      {
        protocol: 'tcp',
        value: 22
      }
    ],
    env: {},
    gpu_count: 0,
    replicas: 1,
    status: 'disabled',
    created_at: '2026-04-05T10:00:00Z',
    updated_at: '2026-04-14T10:00:00Z'
  },
  {
    id: 6,
    name: 'Inference Server',
    image: 'vllm/vllm-openai:latest',
    vendor: 'cuda',
    run_command: 'python -m vllm.entrypoints.openai.api_server',
    boot_disk_size_gb: 80,
    volume_size_gb: 300,
    volume_mount_path: '/models',
    ports: [
      {
        protocol: 'udp',
        value: 8000
      },
      {
        protocol: 'tcp',
        value: 8080
      }
    ],
    env: {
      VLLM_WORKER_MULTIPROC_METHOD: 'spawn'
    },
    gpu_count: 4,
    replicas: 2,
    status: 'enabled',
    created_at: '2026-04-06T10:00:00Z',
    updated_at: '2026-04-15T10:00:00Z'
  }
];
