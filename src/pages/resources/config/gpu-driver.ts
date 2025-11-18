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
    driver: 'amd-smi static'
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
  return `${config.driver} >/dev/null 2>&1 && echo "${config.label} driver OK" || (echo "${config.label} driver issue"; exit 1) && sudo docker info 2>/dev/null | grep -q "${config.runtime}" && echo "${config.label} Container Toolkit OK" || (echo "${config.label} Container Toolkit not configured"; exit 1)`;
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
  const config = GPUsConfigs[gpu] || {};
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
const setNormalArgs = (params: any) => {
  return `sudo docker run -d --name gpustack-worker \\
      --restart=unless-stopped \\
      --privileged \\
      --network=host \\
      --volume /var/run/docker.sock:/var/run/docker.sock \\
      --volume gpustack-data:/var/lib/gpustack \\
      ${params.modelDir ? `--volume ${params.modelDir}:${params.modelDir} \\` : ''}`;
};

const setImageArgs = (params: any) => {
  return `${params.image} \\
      --server-url ${params.server} \\
      --token ${params.token} \\`;
};

// avaliable for  NVIDIA、AMD、MThreads
const registerWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
  modelDir?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  // remove empty enter lines and trailing backslash
  return `${commonArgs}
      --runtime ${config.runtime} \\
      ${imageArgs}
      ${params.workerIP ? `--advertise-address ${params.workerIP} \\` : ''}`;
};

// avaliable for Ascend
const registerAscendWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
  modelDir?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  return `${commonArgs}
      --env "ASCEND_VISIBLE_DEVICES=$(sudo ls /dev/davinci* | head -1 | grep -o '[0-9]\\+' || echo "0")" \\
      --runtime ${config.runtime} \\
      ${imageArgs}
      ${params.workerIP ? `--advertise-address ${params.workerIP} \\` : ''}`;
};

const registerHygonWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
  modelDir?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  return `${commonArgs}
      --volume /opt/hyhal:/opt/hyhal:ro \\
      --volume /opt/dtk:/opt/dtk:ro \\
      --env ROCM_PATH=/opt/dtk \\
      --env ROCM_SMI_LIB_PATH=/opt/hyhal/lib \\
      ${imageArgs}
      ${params.workerIP ? `--advertise-address ${params.workerIP} \\` : ''}`;
};

const registerIluvatarWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
  modelDir?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  return `${commonArgs}
      --volume /lib/modules:/lib/modules:ro \\
      --volume /usr/local/corex:/usr/local/corex:ro \\
      --volume /usr/bin/ixsmi:/usr/bin/ixsmi \\
      --runtime ${config.runtime} \\
      ${imageArgs}
      ${params.workerIP ? `--advertise-address ${params.workerIP} \\` : ''}`;
};

const registerMetaXWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
  modelDir?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  return `${commonArgs}
      --volume /opt/mxdriver:/opt/mxdriver:ro \\
      --volume /opt/maca:/opt/maca:ro \\
      ${imageArgs}
      ${params.workerIP ? `--advertise-address ${params.workerIP} \\` : ''}`;
};

const registerCambriconWorker = (params: {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
  modelDir?: string;
}) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  return `${commonArgs}
      --volume /usr/local/neuware:/usr/local/neuware:ro \\
      --volume /usr/bin/cnmon:/usr/bin/cnmon \\
      ${imageArgs}
      ${params.workerIP ? `--advertise-address ${params.workerIP} \\` : ''}`;
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
  [GPUDriverMap.NVIDIA]: [],
  [GPUDriverMap.AMD]: [],
  [GPUDriverMap.MOORE_THREADS]: [],
  [GPUDriverMap.ASCEND]: [],
  [GPUDriverMap.HYGON]: [
    'clusters.addworker.hygonNotes',
    'clusters.addworker.hygonNotes-02'
  ],
  [GPUDriverMap.ILUVATAR]: ['clusters.addworker.corexNotes'],
  [GPUDriverMap.CAMBRICON]: ['clusters.addworker.cambriconNotes'],
  [GPUDriverMap.METAX]: ['clusters.addworker.metaxNotes']
};
