import { StatusMaps } from '@/config';
import { ProviderValueMap } from '@/pages/cluster-management/config';

export const WorkerStatusMap = {
  ready: 'ready',
  not_ready: 'not_ready',
  unreachable: 'unreachable',
  provisioning: 'provisioning',
  deleting: 'deleting',
  error: 'error',
  pending: 'pending',
  initializing: 'initializing'
};

export const WorkerStatusMapValue = {
  [WorkerStatusMap.ready]: 'Ready',
  [WorkerStatusMap.not_ready]: 'Not Ready',
  [WorkerStatusMap.unreachable]: 'Unreachable',
  [WorkerStatusMap.provisioning]: 'Provisioning',
  [WorkerStatusMap.deleting]: 'Deleting',
  [WorkerStatusMap.error]: 'Error',
  [WorkerStatusMap.initializing]: 'Initializing',
  [WorkerStatusMap.pending]: 'Pending'
};

export const status: any = {
  [WorkerStatusMap.ready]: StatusMaps.success,
  [WorkerStatusMap.not_ready]: StatusMaps.error,
  [WorkerStatusMap.unreachable]: StatusMaps.error,
  [WorkerStatusMap.provisioning]: StatusMaps.transitioning,
  [WorkerStatusMap.deleting]: StatusMaps.transitioning,
  [WorkerStatusMap.error]: StatusMaps.error,
  [WorkerStatusMap.pending]: StatusMaps.transitioning,
  [WorkerStatusMap.initializing]: StatusMaps.transitioning
};

export const GPUsConfigs: Record<string, any> = {
  cuda: {
    label: 'NVIDIA',
    value: 'cuda',
    runtime: 'nvidia',
    driver: 'nvidia-smi'
  },
  rocm: {
    label: 'AMD',
    value: 'rocm',
    runtime: 'rocm',
    driver: 'rocm-smi'
  },
  npu: {
    label: 'Ascend',
    value: 'npu',
    runtime: 'ascend',
    driver: 'npu-smi'
  },
  dcu: {
    label: 'Hygon',
    value: 'dcu',
    runtime: 'dcu', // TODO: confirm runtime name
    driver: 'hy-smi'
  },
  musa: {
    label: 'Moore Threads',
    value: 'musa',
    runtime: 'mthreads',
    driver: 'mthreads-gmi'
  },
  corex: {
    label: 'Iluvatar',
    value: 'corex',
    runtime: 'corex', // TODO: confirm runtime name
    driver: 'ixsmi'
  },
  cambricon: {
    label: 'Cambricon',
    value: 'cambricon',
    runtime: 'cambricon',
    driver: 'cnmon'
  },
  metax: {
    label: 'MetaX',
    value: 'metax',
    runtime: 'metax',
    driver: 'mx-smi'
  }
};

export const addWorkerGuide: Record<string, any> = {
  mac: {
    getToken: 'cat /var/lib/gpustack/token',
    registerWorker(params: { server: string; token: string }) {
      return `curl -sfL https://get.gpustack.ai | sh -s - --server-url ${params.server} --registration-token ${params.token}`;
    }
  },
  win: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(params: { server: string; token: string }) {
      return `Invoke-Expression "& { $((Invoke-WebRequest -Uri 'https://get.gpustack.ai' -UseBasicParsing).Content) } --server-url '${params.server}' --registration-token '${params.token}'"`;
    }
  },
  all: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(params: {
      server: string;
      tag: string;
      token: string;
      image: string;
      workerip: string;
    }) {
      return `docker run -d --name gpustack-worker \\
    --restart=unless-stopped \\
    --privileged \\
    --net=host \\
    -v /var/run/docker.sock:/var/run/docker.sock \\
    -v /var/lib/gpustack:/var/lib/gpustack \\
    ${params.image} \\
    --server-url ${params.server} \\
    --registration-token ${params.token} \\
    --worker-ip ${params.workerip}`;
    },
    checkEnvCommand(gpu: string) {
      const config = GPUsConfigs[gpu];
      return {
        [ProviderValueMap.Docker]: `${config.driver} >/dev/null 2>&1 && echo "${config.label} driver OK" || (echo "${config.label} driver issue"; exit 1) && docker info 2>/dev/null | grep -q "Default Runtime: ${config.runtime}" && echo "${config.label} Container Toolkit OK" || (echo "${config.label} Container Toolkit not configured"; exit 1)`,
        [ProviderValueMap.Kubernetes]: `kubectl get runtimeclass ${config.runtime} > /dev/null 2>&1  && echo "${config.label} runtimeclass registered" || (echo "${config.label} runtimeclass issue"; exit 1)`
      };
    }
  },
  npu: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(params: {
      server: string;
      tag: string;
      token: string;
      workerip: string;
      image: string;
    }) {
      return `docker run -d --name gpustack \\
    --restart=unless-stopped \\
    --device /dev/davinci0 \\
    --device /dev/davinci1 \\
    --device /dev/davinci_manager \\
    --device /dev/devmm_svm \\
    --device /dev/hisi_hdc \\
    -v /usr/local/dcmi:/usr/local/dcmi \\
    -v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \\
    -v /usr/local/Ascend/driver/lib64/:/usr/local/Ascend/driver/lib64/ \\
    -v /usr/local/Ascend/driver/version.info:/usr/local/Ascend/driver/version.info \\
    -v /etc/ascend_install.info:/etc/ascend_install.info \\
    --network=host \\
    --ipc=host \\
    -v gpustack-data:/var/lib/gpustack \\
    ${params.image} \\
    --server-url ${params.server} --registration-token ${params.token} --worker-ip ${params.workerip}`;
    }
  },
  npu310p: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(params: {
      server: string;
      tag: string;
      token: string;
      workerip: string;
      image: string;
    }) {
      return `docker run -d --name gpustack \\
    --restart=unless-stopped \\
    --device /dev/davinci0 \\
    --device /dev/davinci1 \\
    --device /dev/davinci_manager \\
    --device /dev/devmm_svm \\
    --device /dev/hisi_hdc \\
    -v /usr/local/dcmi:/usr/local/dcmi \\
    -v /usr/local/bin/npu-smi:/usr/local/bin/npu-smi \\
    -v /usr/local/Ascend/driver/lib64/:/usr/local/Ascend/driver/lib64/ \\
    -v /usr/local/Ascend/driver/version.info:/usr/local/Ascend/driver/version.info \\
    -v /etc/ascend_install.info:/etc/ascend_install.info \\
    --network=host \\
    --ipc=host \\
    -v gpustack-data:/var/lib/gpustack \\
    ${params.image} -310p \\
    --server-url ${params.server} --registration-token ${params.token} --worker-ip ${params.workerip}`;
    }
  },
  musa: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(params: {
      server: string;
      tag: string;
      token: string;
      workerip: string;
      image: string;
    }) {
      return `docker run -d --name gpustack \\
    --restart=unless-stopped \\
    --network=host \\
    --ipc=host \\
    -v gpustack-data:/var/lib/gpustack \\
    ${params.image} \\
    --server-url ${params.server} --registration-token ${params.token} --worker-ip ${params.workerip}`;
    }
  },
  cpu: {
    getToken:
      'Get-Content -Path (Join-Path -Path $env:APPDATA -ChildPath "gpustack\\token") -Raw',
    registerWorker(params: {
      server: string;
      tag: string;
      token: string;
      workerip: string;
      image: string;
    }) {
      return `docker run -d --name gpustack \\
    --restart=unless-stopped \\
    --network=host \\
    -v gpustack-data:/var/lib/gpustack \\
    ${params.image} \\
    --server-url ${params.server} --registration-token ${params.token} --worker-ip ${params.workerip}`;
    }
  },
  rocm: {
    registerWorker(params: {
      server: string;
      tag: string;
      token: string;
      workerip: string;
      image: string;
    }) {
      return `docker run -d --name gpustack \\
    --restart=unless-stopped \\
    --device=/dev/kfd \\
    --device=/dev/dri \\
    --network=host \\
    --ipc=host \\
    --group-add video \\
    --cap-add=SYS_PTRACE \\
    --security-opt seccomp=unconfined \\
    -v gpustack-data:/var/lib/gpustack \\
    ${params.image} \\
    --server-url ${params.server} --registration-token ${params.token} --worker-ip ${params.workerip}`;
    }
  },
  dcu: {
    registerWorker(params: {
      server: string;
      tag: string;
      token: string;
      workerip: string;
      image: string;
    }) {
      return `docker run -d --name gpustack \\
    --restart=unless-stopped \\
    --device=/dev/kfd \\
    --device=/dev/mkfd \\
    --device=/dev/dri \\
    -v /opt/hyhal:/opt/hyhal:ro \\
    --network=host \\
    --ipc=host \\
    --group-add video \\
    --cap-add=SYS_PTRACE \\
    --security-opt seccomp=unconfined \\
    -v gpustack-data:/var/lib/gpustack \\
    ${params.image} \\
    --server-url ${params.server} --registration-token ${params.token} --worker-ip ${params.workerip}`;
    }
  },
  corex: {
    registerWorker(params: {
      server: string;
      tag: string;
      token: string;
      workerip: string;
      image: string;
    }) {
      return `docker run -d --name gpustack \\
    -v /lib/modules:/lib/modules \\
    -v /dev:/dev \\
    --privileged \\
    --cap-add=ALL \\
    --pid=host \\
    --restart=unless-stopped \\
    --network=host \\
    --ipc=host \\
    -v gpustack-data:/var/lib/gpustack \\
    ${params.image} \\
     --server-url ${params.server} --registration-token ${params.token} --worker-ip ${params.workerip}`;
    }
  },
  container: {
    getToken:
      'docker exec -it ${gpustack_container_id} cat /var/lib/gpustack/token'
  }
};

export const containerInstallOptions = [
  { label: 'NVIDIA CUDA', value: 'cuda' },
  { label: 'AMD ROCm', value: 'rocm' },
  { label: 'Ascend CANN', value: 'npu' },
  { label: 'Hygon DTK', value: 'dcu' },
  { label: 'Moore Threads MUSA', value: 'musa' },
  { label: 'Iluvatar Corex', value: 'corex' }
  // { label: 'CPU', value: 'cpu' }
];

export const ModelfileStateMap = {
  Error: 'error',
  Downloading: 'downloading',
  Ready: 'ready'
};

export const ModelfileStateMapValue = {
  [ModelfileStateMap.Error]: 'Error',
  [ModelfileStateMap.Downloading]: 'Downloading',
  [ModelfileStateMap.Ready]: 'Ready'
};

export const ModelfileState: any = {
  [ModelfileStateMap.Ready]: StatusMaps.success,
  [ModelfileStateMap.Error]: StatusMaps.error,
  [ModelfileStateMap.Downloading]: StatusMaps.transitioning
};
