export const GPUDriverMap = {
  NVIDIA: 'cuda',
  AMD: 'rocm',
  ASCEND: 'cann',
  HYGON: 'dtk',
  MOORE_THREADS: 'musa',
  ILUVATAR: 'corex',
  CAMBRICON: 'neuware',
  METAX: 'maca'
};

const ManufacturerMap = {
  [GPUDriverMap.NVIDIA]: 'NVIDIA',
  [GPUDriverMap.AMD]: 'AMD',
  [GPUDriverMap.ASCEND]: 'Huawei',
  [GPUDriverMap.HYGON]: 'Hygon',
  [GPUDriverMap.MOORE_THREADS]: 'Moore Threads',
  [GPUDriverMap.ILUVATAR]: 'Iluvatar',
  [GPUDriverMap.CAMBRICON]: 'Cambricon',
  [GPUDriverMap.METAX]: 'MetaX'
};

export const GPUsConfigs: Record<
  string,
  { label: string; value: string; runtime: string; driver: string }
> = {
  [GPUDriverMap.NVIDIA]: {
    label: ManufacturerMap[GPUDriverMap.NVIDIA],
    value: GPUDriverMap.NVIDIA,
    runtime: 'nvidia',
    driver: 'nvidia-smi'
  },
  [GPUDriverMap.AMD]: {
    label: ManufacturerMap[GPUDriverMap.AMD],
    value: GPUDriverMap.AMD,
    runtime: 'amd',
    driver: 'amd-smi'
  },
  [GPUDriverMap.ASCEND]: {
    label: ManufacturerMap[GPUDriverMap.ASCEND],
    value: GPUDriverMap.ASCEND,
    runtime: 'ascend',
    driver: 'npu-smi info'
  },
  [GPUDriverMap.HYGON]: {
    label: ManufacturerMap[GPUDriverMap.HYGON],
    value: GPUDriverMap.HYGON,
    runtime: '', // TODO: confirm runtime name
    driver: 'hy-smi'
  },
  [GPUDriverMap.MOORE_THREADS]: {
    label: ManufacturerMap[GPUDriverMap.MOORE_THREADS],
    value: GPUDriverMap.MOORE_THREADS,
    runtime: 'mthreads',
    driver: 'mthreads-gmi'
  },
  [GPUDriverMap.ILUVATAR]: {
    label: ManufacturerMap[GPUDriverMap.ILUVATAR],
    value: GPUDriverMap.ILUVATAR,
    runtime: 'iluvatar', // TODO: confirm runtime name
    driver: 'ixsmi'
  },
  [GPUDriverMap.CAMBRICON]: {
    label: ManufacturerMap[GPUDriverMap.CAMBRICON],
    value: GPUDriverMap.CAMBRICON,
    runtime: 'cambricon',
    driver: 'cnmon info'
  },
  [GPUDriverMap.METAX]: {
    label: ManufacturerMap[GPUDriverMap.METAX],
    value: GPUDriverMap.METAX,
    runtime: 'metax',
    driver: 'mx-smi'
  }
};

// Generate the Docker environment command: available for NVIDIA, AMD, Ascend, Moore Threads
const generateNvidiaDockerEnvCommand = (config: {
  label: string;
  value: string;
  runtime: string;
  driver: string;
}) => {
  return `${config.driver} >/dev/null 2>&1 && echo "${config.label} driver OK" || (echo "${config.label} driver issue"; exit 1) && docker info 2>/dev/null | grep -q "${config.runtime}" && echo "${config.label} Container Toolkit OK" || (echo "${config.label} Container Toolkit not configured"; exit 1)`;
};

// avaliable for Hygon、Iluvatar、MetaX 、Cambricon
const generateHygonDockerEnvCommand = (config: {
  label: string;
  value: string;
  runtime: string;
  driver: string;
}) => {
  return `${config.driver} >/dev/null 2>&1 && echo "${config.label} driver OK" || (echo "${config.label} driver issue"; exit 1)`;
};

// available for Kubernetes
export const generateKubernetesEnvCommand = (gpu: string) => {
  const config = GPUsConfigs[gpu];
  return `kubectl get runtimeclass ${config.runtime} > /dev/null 2>&1  && echo "${config.label} runtimeclass registered" || (echo "${config.label} runtimeclass issue"; exit 1)`;
};

export const dockerEnvCommandMap = {
  [GPUDriverMap.NVIDIA]: generateNvidiaDockerEnvCommand(
    GPUsConfigs[GPUDriverMap.NVIDIA]
  ),
  [GPUDriverMap.AMD]: generateNvidiaDockerEnvCommand(
    GPUsConfigs[GPUDriverMap.AMD]
  ),
  [GPUDriverMap.ASCEND]: generateNvidiaDockerEnvCommand(
    GPUsConfigs[GPUDriverMap.ASCEND]
  ),
  [GPUDriverMap.MOORE_THREADS]: generateNvidiaDockerEnvCommand(
    GPUsConfigs[GPUDriverMap.MOORE_THREADS]
  ),
  [GPUDriverMap.HYGON]: generateHygonDockerEnvCommand(
    GPUsConfigs[GPUDriverMap.HYGON]
  ),
  [GPUDriverMap.ILUVATAR]: generateHygonDockerEnvCommand(
    GPUsConfigs[GPUDriverMap.ILUVATAR]
  ),
  [GPUDriverMap.CAMBRICON]: generateHygonDockerEnvCommand(
    GPUsConfigs[GPUDriverMap.CAMBRICON]
  ),
  [GPUDriverMap.METAX]: generateHygonDockerEnvCommand(
    GPUsConfigs[GPUDriverMap.METAX]
  )
};

// avaliable for  NVIDIA、AMD、MThreads
const registerWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  return `sudo docker run -d --name gpustack-worker \\
      --restart=unless-stopped \\
      --privileged \\
      --volume /var/run/docker.sock:/var/run/docker.sock \\
      --volume gpustack-data:/var/lib/gpustack \\
      --runtime ${config.runtime} \\
      ${params.image} \\
      --server-url ${params.server} \\
      --token ${params.token} \\
      ${params.workerIP ? `--advertise-address ${params.workerIP}` : ''}`.trim();
};

// avaliable for Ascend
const registerAscendWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  return `sudo docker run -d --name gpustack-worker \\
      --restart=unless-stopped \\
      --privileged \\
      --network=host \\
      --env "ASCEND_VISIBLE_DEVICES=$(npu-smi info -m | tail -n 1 | awk '{print $1}') \\
      --volume /var/run/docker.sock:/var/run/docker.sock \\
      --volume gpustack-data:/var/lib/gpustack \\
      --runtime ${config.runtime} \\
      ${params.image} \\
      --server-url ${params.server} \\
      --token ${params.token} \\
      ${params.workerIP ? `--advertise-address ${params.workerIP}` : ''}`.trim();
};

const registerHygonWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  return `sudo docker run -d --name gpustack-worker \\
      --restart=unless-stopped \\
      --privileged \\
      --network=host \\
      --env ROCM_PATH=/opt/dtk \\
      --env ROCM_SMI_LIB_PATH=/opt/hyhal/lib \\
      --volume /var/run/docker.sock:/var/run/docker.sock \\
      --volume gpustack-data:/var/lib/gpustack \\
      --volume /opt/hyhal:/opt/hyhal:ro \\
      --volume /opt/dtk:/opt/dtk:ro \\
      ${params.image} \\
      --server-url ${params.server} \\
      --token ${params.token} \\
      ${params.workerIP ? `--advertise-address ${params.workerIP}` : ''}`.trim();
};

const registerIluvatarWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  return `sudo docker run -d --name gpustack-worker \\
      --restart=unless-stopped \\
      --privileged \\
      --network=host \\
      --volume /var/run/docker.sock:/var/run/docker.sock \\
      --volume gpustack-data:/var/lib/gpustack \\
      --volume /lib/modules:/lib/modules:ro \\
      --volume /usr/local/corex:/usr/local/corex:ro \\
      --volume /usr/bin/ixsmi:/usr/bin/ixsmi \\
      --runtime ${config.runtime} \\
      ${params.image} \\
      --server-url ${params.server} \\
      --token ${params.token} \\
      ${params.workerIP ? `--advertise-address ${params.workerIP}` : ''}`.trim();
};

const registerMetaXWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  return `sudo docker run -d --name gpustack-worker \\
      --restart=unless-stopped \\
      --privileged \\
      --network=host \\
      --volume /var/run/docker.sock:/var/run/docker.sock \\
      --volume gpustack-data:/var/lib/gpustack \\
      --volume /opt/mxdriver:/opt/mxdriver:ro \\
      --volume /opt/maca:/opt/maca:ro \\
      ${params.image} \\
      --server-url ${params.server} \\
      --token ${params.token} \\
      ${params.workerIP ? `--advertise-address ${params.workerIP}` : ''}`.trim();
};

const registerCambriconWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  return `sudo docker run -d --name gpustack-worker \\
      --restart=unless-stopped \\
      --privileged \\
      --network=host \\
      --volume /var/run/docker.sock:/var/run/docker.sock \\
      --volume gpustack-data:/var/lib/gpustack \\
      --volume /usr/local/neuware:/usr/local/neuware:ro \\
      --volume /usr/bin/cnmon:/usr/bin/cnmon \\
      ${params.image} \\
      --server-url ${params.server} \\
      --token ${params.token} \\
      ${params.workerIP ? `--advertise-address ${params.workerIP}` : ''}`.trim();
};

export const registerAddWokerCommandMap = {
  [GPUDriverMap.NVIDIA]: registerWorker,
  [GPUDriverMap.AMD]: registerWorker,
  [GPUDriverMap.ASCEND]: registerAscendWorker,
  [GPUDriverMap.HYGON]: registerHygonWorker,
  [GPUDriverMap.ILUVATAR]: registerIluvatarWorker,
  [GPUDriverMap.CAMBRICON]: registerCambriconWorker,
  [GPUDriverMap.METAX]: registerMetaXWorker,
  [GPUDriverMap.MOORE_THREADS]: registerWorker
};

export const AddWorkerDockerNotes: Record<string, string[]> = {
  [GPUDriverMap.NVIDIA]: [
    'clusters.addworker.nvidiaNotes-01',
    'clusters.addworker.nvidiaNotes-02'
  ],
  [GPUDriverMap.AMD]: [
    'clusters.addworker.nvidiaNotes-01',
    'clusters.addworker.nvidiaNotes-02'
  ],
  [GPUDriverMap.MOORE_THREADS]: [
    'clusters.addworker.nvidiaNotes-01',
    'clusters.addworker.nvidiaNotes-02'
  ],
  [GPUDriverMap.ASCEND]: [
    'clusters.addworker.nvidiaNotes-01',
    'clusters.addworker.nvidiaNotes-02'
  ],
  [GPUDriverMap.HYGON]: [
    'clusters.addworker.nvidiaNotes-01',
    'clusters.addworker.nvidiaNotes-02',
    'clusters.addworker.hygonNotes',
    'clusters.addworker.hygonNotes-02'
  ],
  [GPUDriverMap.ILUVATAR]: [
    'clusters.addworker.nvidiaNotes-01',
    'clusters.addworker.nvidiaNotes-02',
    'clusters.addworker.corexNotes'
  ],
  [GPUDriverMap.CAMBRICON]: [
    'clusters.addworker.nvidiaNotes-01',
    'clusters.addworker.nvidiaNotes-02',
    'clusters.addworker.cambriconNotes'
  ],
  [GPUDriverMap.METAX]: [
    'clusters.addworker.nvidiaNotes-01',
    'clusters.addworker.nvidiaNotes-02',
    'clusters.addworker.metaxNotes'
  ]
};
