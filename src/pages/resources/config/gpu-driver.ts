import _ from 'lodash';

export const GPUDriverMap = {
  NVIDIA: 'cuda',
  AMD: 'rocm',
  ASCEND: 'cann',
  HYGON: 'dtk',
  MOORE_THREADS: 'musa',
  ILUVATAR: 'corex',
  CAMBRICON: 'neuware',
  METAX: 'maca',
  THEAD: 'hggc'
};

export const ManufacturerMap = {
  [GPUDriverMap.NVIDIA]: 'NVIDIA',
  [GPUDriverMap.AMD]: 'AMD',
  [GPUDriverMap.ASCEND]: 'vendor.ascend',
  [GPUDriverMap.HYGON]: 'vendor.hygon',
  [GPUDriverMap.MOORE_THREADS]: 'vendor.moorthreads',
  [GPUDriverMap.ILUVATAR]: 'vendor.iluvatar',
  [GPUDriverMap.CAMBRICON]: 'vendor.cambricon',
  [GPUDriverMap.METAX]: 'vendor.metax',
  [GPUDriverMap.THEAD]: 'vendor.thead'
};

export const GPUsConfigs: Record<
  string,
  { label: string; value: string; runtime: string; driver: string }
> = {
  [GPUDriverMap.NVIDIA]: {
    label: 'Nvidia', // this label is used in echo command, do not translate
    value: GPUDriverMap.NVIDIA,
    runtime: 'nvidia',
    driver: 'nvidia-smi'
  },
  [GPUDriverMap.AMD]: {
    label: 'AMD',
    value: GPUDriverMap.AMD,
    runtime: 'amd',
    driver: 'amd-smi static'
  },
  [GPUDriverMap.ASCEND]: {
    label: 'Ascend',
    value: GPUDriverMap.ASCEND,
    runtime: 'ascend',
    driver: 'npu-smi info'
  },
  [GPUDriverMap.HYGON]: {
    label: 'Hygon',
    value: GPUDriverMap.HYGON,
    runtime: '', // TODO: confirm runtime name
    driver: 'hy-smi'
  },
  [GPUDriverMap.MOORE_THREADS]: {
    label: 'Moore Threads',
    value: GPUDriverMap.MOORE_THREADS,
    runtime: 'mthreads',
    driver: 'mthreads-gmi'
  },
  [GPUDriverMap.ILUVATAR]: {
    label: 'Iluvatar',
    value: GPUDriverMap.ILUVATAR,
    runtime: 'iluvatar',
    driver: 'ixsmi'
  },
  [GPUDriverMap.CAMBRICON]: {
    label: 'Cambricon',
    value: GPUDriverMap.CAMBRICON,
    runtime: 'cambricon',
    driver: 'cnmon info'
  },
  [GPUDriverMap.METAX]: {
    label: 'Metax',
    value: GPUDriverMap.METAX,
    runtime: 'metax',
    driver: 'mx-smi'
  },
  [GPUDriverMap.THEAD]: {
    label: 'T-Head PPU',
    value: GPUDriverMap.THEAD,
    runtime: '', // TODO: confirm runtime name
    driver: 'ppu-smi'
  }
};

// Generate the Docker environment command: available for NVIDIA, AMD, Ascend, Moore Threads
const generateNvidiaDockerEnvCommand = (config: {
  label: string;
  value: string;
  runtime: string;
  driver: string;
}) => {
  const runtimeCheck =
    config.runtime === 'nvidia' ? 'Runtime.*nvidia' : config.runtime;

  return `${config.driver} >/dev/null 2>&1 && echo "${config.label} driver OK" || (echo "${config.label} driver issue"; exit 1) && sudo docker info 2>/dev/null | grep -q "${runtimeCheck}" && echo "${config.label} Container Toolkit OK" || (echo "${config.label} Container Toolkit not configured"; exit 1)`;
};

// avaliable for Hygon、Iluvatar、MetaX 、Cambricon、T-Head
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
  ),
  [GPUDriverMap.THEAD]: generateHygonDockerEnvCommand(
    GPUsConfigs[GPUDriverMap.THEAD]
  )
};

interface AddWorkerCommandParams {
  server: string;
  tag: string;
  token: string;
  image: string;
  gpu: string;
  workerIP?: string;
  modelDir?: string;
  containerName?: string;
  gpustackDataVolume?: string;
  cacheDir?: string;
}

const generateEnvArgs = (params: any) => {
  const registrationInfo = {
    ...params.registrationInfo,
    env: {
      ...(params.registrationInfo?.env || {}),
      ...params.extraEnv
    }
  };
  // generate environment variables args from registrationInfo.env
  let envArgs = '';
  if (
    registrationInfo.env &&
    typeof registrationInfo.env === 'object' &&
    Object.keys(registrationInfo.env).length > 0
  ) {
    Object.keys(registrationInfo.env).forEach((key) => {
      const value = registrationInfo.env[key];
      envArgs += `-e "${key}=${value}" \\\n      `;
    });
  }
  return envArgs;
};

// concat the args, the args is a key-value
const generateExtraArgs = (params: any) => {
  const args = params.registrationInfo?.args || [];
  if (args.length === 0) {
    return '';
  }
  let argsStr = '';
  args.forEach((item: string[]) => {
    argsStr += `${item[0]} ${_.isBoolean(item[1]) ? item[1] : item[1] || ''} \\\n      `;
  });
  return argsStr;
};

const generateExtraModelDirArg = (modelDir: string) => {
  const pathList = modelDir
    ?.split(',')
    .map((item) => item.trim())
    .filter((item) => item);
  if (pathList && pathList.length > 0) {
    return pathList
      .map((item) => `--volume ${item}:${item} \\`)
      .join('\n      ');
  }
  return '';
};

const setNormalArgs = (params: any) => {
  return `sudo docker run -d --name ${params.containerName || 'gpustack-worker'} \\
      -e "GPUSTACK_RUNTIME_DEPLOY_MIRRORED_NAME=${params.containerName || 'gpustack-worker'}" \\
      ${generateEnvArgs(params)}
      --restart=unless-stopped \\
      --privileged \\
      --network=host \\
      --volume /var/run/docker.sock:/var/run/docker.sock \\
      --volume ${params.gpustackDataVolume || 'gpustack-data'}:/var/lib/gpustack \\
      ${generateExtraModelDirArg(params.modelDir)}
      ${params.cacheDir ? `--volume ${params.cacheDir}:/var/lib/gpustack/cache \\` : ''}`;
};

const setWorkerIPArg = (params: any) => {
  return `${params.workerIP ? `--worker-ip ${params.workerIP} \\` : ''}
      ${params.advertisAddress ? `--advertise-address ${params.advertisAddress} \\` : ''}`;
};

const setImageArgs = (params: any) => {
  return `${params.image} \\
      --server-url ${params.server} \\`;
};

// avaliable for  NVIDIA、MThreads
const registerWorker = (params: AddWorkerCommandParams) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);

  // remove empty enter lines and trailing backslash
  return `${commonArgs}
      --runtime ${config.runtime} \\
      ${imageArgs}
      ${setWorkerIPArg(params)}`;
};

// avaliable for AMD
const registerAMDWorker = (params: AddWorkerCommandParams) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  // remove empty enter lines and trailing backslash
  return `${commonArgs}
      --volume /opt/rocm:/opt/rocm:ro \\
      --runtime ${config.runtime} \\
      ${imageArgs}
      ${setWorkerIPArg(params)}`;
};

// avaliable for Ascend
const registerAscendWorker = (params: AddWorkerCommandParams) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  return `${commonArgs}
      --env "ASCEND_VISIBLE_DEVICES=$(sudo ls /dev/davinci* | head -1 | grep -o '[0-9]\\+' || echo "0")" \\
      --runtime ${config.runtime} \\
      ${imageArgs}
      ${setWorkerIPArg(params)}`;
};

// avaliable for t-head

const registerTHeadWorker = (params: AddWorkerCommandParams) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs({
    ...params,
    extraEnv: {
      GPUSTACK_RUNTIME_DOCKER_RESOURCE_INJECTION_POLICY: 'CDI'
    }
  });
  const imageArgs = setImageArgs(params);
  return `${commonArgs}
      --volume /usr/local/PPU_SDK:/usr/local/PPU_SDK:ro \\
      --volume /var/run/cdi:/var/run/cdi \\
      ${imageArgs}
      ${setWorkerIPArg(params)}`;
};

const registerHygonWorker = (params: AddWorkerCommandParams) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  return `${commonArgs}
      --volume /opt/hyhal:/opt/hyhal:ro \\
      --volume /opt/dtk:/opt/dtk:ro \\
      --env ROCM_PATH=/opt/dtk \\
      --env ROCM_SMI_LIB_PATH=/opt/hyhal/lib \\
      ${imageArgs}
      ${setWorkerIPArg(params)}`;
};

const registerIluvatarWorker = (params: AddWorkerCommandParams) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  return `${commonArgs}
      --volume /usr/local/corex:/usr/local/corex:ro \\
      --runtime ${config.runtime} \\
      ${imageArgs}
      ${setWorkerIPArg(params)}`;
};

const registerMetaXWorker = (params: AddWorkerCommandParams) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  return `${commonArgs}
      --volume /opt/mxdriver:/opt/mxdriver:ro \\
      --volume /opt/maca:/opt/maca:ro \\
      ${imageArgs}
      ${setWorkerIPArg(params)}`;
};

const registerCambriconWorker = (params: AddWorkerCommandParams) => {
  const config = GPUsConfigs[params.gpu];
  const commonArgs = setNormalArgs(params);
  const imageArgs = setImageArgs(params);
  return `${commonArgs}
      --volume /usr/local/neuware:/usr/local/neuware:ro \\
      --volume /usr/bin/cnmon:/usr/bin/cnmon \\
      ${imageArgs}
      ${setWorkerIPArg(params)}`;
};

export const registerAddWokerCommandMap = {
  [GPUDriverMap.NVIDIA]: registerWorker,
  [GPUDriverMap.AMD]: registerAMDWorker,
  [GPUDriverMap.ASCEND]: registerAscendWorker,
  [GPUDriverMap.HYGON]: registerHygonWorker,
  [GPUDriverMap.ILUVATAR]: registerIluvatarWorker,
  [GPUDriverMap.CAMBRICON]: registerCambriconWorker,
  [GPUDriverMap.METAX]: registerMetaXWorker,
  [GPUDriverMap.MOORE_THREADS]: registerWorker,
  [GPUDriverMap.THEAD]: registerTHeadWorker
};

export const AddWorkerDockerNotes: Record<string, string[]> = {
  [GPUDriverMap.NVIDIA]: [],
  [GPUDriverMap.AMD]: ['clusters.addworker.amdNotes-01'],
  [GPUDriverMap.MOORE_THREADS]: [],
  [GPUDriverMap.ASCEND]: [],
  [GPUDriverMap.HYGON]: [
    'clusters.addworker.hygonNotes',
    'clusters.addworker.hygonNotes-02'
  ],
  [GPUDriverMap.ILUVATAR]: ['clusters.addworker.corexNotes'],
  [GPUDriverMap.CAMBRICON]: ['clusters.addworker.cambriconNotes'],
  [GPUDriverMap.METAX]: ['clusters.addworker.metaxNotes'],
  [GPUDriverMap.THEAD]: [
    'clusters.addworker.theadNotes',
    'clusters.addworker.theadNotes-02'
  ]
};
