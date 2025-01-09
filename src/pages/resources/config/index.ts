import { StatusMaps } from '@/config';

export const WorkerStatusMap = {
  ready: 'ready',
  not_ready: 'not_ready'
};

export const WorkerStatusMapValue = {
  [WorkerStatusMap.ready]: 'Ready',
  [WorkerStatusMap.not_ready]: 'Not Ready'
};

export const status: any = {
  [WorkerStatusMap.ready]: StatusMaps.success,
  [WorkerStatusMap.not_ready]: StatusMaps.error
};

export const addWorkerGuide: Record<string, any> = {
  mac: {
    getToken: 'cat /var/lib/gpustack/token',
    registerWorker(params: { server: string; token: string }) {
      return `curl -sfL https://get.gpustack.ai | sh -s - --server-url ${params.server} --token ${params.token}`;
    }
  },
  win: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(params: { server: string; token: string }) {
      return `Invoke-Expression "& { $((Invoke-WebRequest -Uri "https://get.gpustack.ai" -UseBasicParsing).Content) } --server-url ${params.server} --token ${params.token}"`;
    }
  },
  cuda: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(params: { server: string; tag: string; token: string }) {
      return `docker run -d --gpus all --ipc=host --network=host gpustack/gpustack:${params.tag} --server-url ${params.server} --token ${params.token}`;
    }
  },
  npu: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(params: { server: string; tag: string; token: string }) {
      return `docker run -d --ipc=host -e ASCEND_VISIBLE_DEVICES=0 --network=host gpustack/gpustack:${params.tag} --server-url ${params.server} --token ${params.token}`;
    }
  },
  musa: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(params: { server: string; tag: string; token: string }) {
      return `docker run -d --ipc=host --network=host gpustack/gpustack:${params.tag} --server-url ${params.server} --token ${params.token}`;
    }
  },
  cpu: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(params: { server: string; tag: string; token: string }) {
      return `docker run -d --ipc=host --network=host gpustack/gpustack:${params.tag} --server-url ${params.server} --token ${params.token}`;
    }
  },
  rocm: {
    registerWorker(params: { server: string; tag: string; token: string }) {
      return `docker run -d --network=host --ipc=host --group-add=video --cap-add=SYS_PTRACE --security-opt seccomp=unconfined --device /dev/kfd --device /dev/dri gpustack/gpustack:${params.tag} --server-url ${params.server} --token ${params.token}`;
    }
  },
  container: {
    getToken:
      'docker run -it ${gpustack_container_id} cat /var/lib/gpustack/token'
  }
};

export const containerInstallOptions = [
  { label: 'CUDA', value: 'cuda' },
  { label: 'AMD', value: 'rocm' },
  { label: 'CANN', value: 'npu' },
  { label: 'MUSA', value: 'musa' },
  { label: 'CPU', value: 'cpu' }
];
