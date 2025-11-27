import MindIELogo from '@/assets/logo/ascend.png';
import SGLangLogo from '@/assets/logo/sglang.png';
import vLLMLogo from '@/assets/logo/vllm.png';
import VoxBoxLogo from '@/assets/logo/voxbox.png';
import icons from '@/components/icon-font/icons';
import { backendOptionsMap } from '@/pages/llmodels/config/backend-parameters';
import {
  GPUDriverMap,
  ManufacturerMap
} from '@/pages/resources/config/gpu-driver';
import jsYaml from 'js-yaml';
import { trim } from 'lodash';

const SealYamlType = new jsYaml.Type('!seal', {
  kind: 'sequence', // See node kinds in YAML spec: http://www.yaml.org/spec/1.2/spec.html#kind//
  construct(data: any) {
    return data.map(function (str: string) {
      return `seal${str}`;
    });
  }
});

const SEAL_SCHEMA = jsYaml.DEFAULT_SCHEMA.extend([SealYamlType]);

export const builtInBackendLogos: Record<string, string> = {
  [backendOptionsMap.SGLang]: SGLangLogo,
  [backendOptionsMap.vllm]: vLLMLogo,
  [backendOptionsMap.ascendMindie]: MindIELogo,
  [backendOptionsMap.voxBox]: VoxBoxLogo
};

export const backendActions = [
  {
    label: 'common.button.edit',
    value: 'edit',
    key: 'edit',
    locale: true,
    icon: icons.EditOutlined
  },
  {
    label: 'backend.export.yaml',
    value: 'yaml',
    key: 'export',
    locale: true,
    icon: icons.Yaml
  },
  {
    label: 'common.button.delete',
    value: 'delete',
    key: 'delete',
    icon: icons.DeleteOutlined,
    locale: true,
    danger: true
  }
];

export const json2Yaml = (obj: Record<string, any>) => {
  if (!obj || !Object.keys(obj).length) return '';
  const res = jsYaml.dump(JSON.parse(JSON.stringify(obj)));
  return res;
};

export const yaml2Json = (input: string) => {
  const str = trim(input);
  const obj = jsYaml.load(str, { schema: SEAL_SCHEMA });
  if (typeof obj !== 'object' || obj === null) {
    return {};
  }
  const jsonStr = JSON.stringify(obj);
  return JSON.parse(jsonStr);
};

export const customColors = [
  'red',
  'orange',
  'gold',
  'lime',
  'volcano',
  'green',
  'magenta',
  'cyan',
  'purple',
  'blue',
  'geekblue'
];

export const gpuColorMap: Record<string, string> = {
  cann: 'orange',
  cuda: 'green',
  rocm: 'volcano',
  dtk: 'magenta',
  musa: 'cyan',
  corex: 'purple',
  maca: 'geekblue',
  neuware: 'gold'
};

export const getGpuColor = (gpuType: string) => {
  if (!gpuType) return 'default';

  return gpuColorMap[gpuType] || 'default';
};

export const customIcons = [
  '∑',
  '∏',
  '∫',
  '∂',
  '∞',
  'π',
  'θ',
  '∆',
  '∇',
  '≤',
  '≥'
];

/**
 * custom backend fields for config yaml
 */
export const customBackendFields = [
  'description',
  'health_check_path',
  'default_run_command',
  'version_configs',
  'default_backend_param'
];

/**
 * built-in backend fields for config yaml
 */
export const builtInBackendFields = [
  'description',
  'version_configs',
  'default_backend_param'
];

export const frameworks = [
  {
    label: 'CUDA',
    value: GPUDriverMap.NVIDIA,
    tips: ManufacturerMap[GPUDriverMap.NVIDIA],
    locale: false
  },
  {
    label: 'ROCm',
    value: GPUDriverMap.AMD,
    tips: ManufacturerMap[GPUDriverMap.AMD],
    locale: false
  },
  {
    label: 'CANN',
    value: GPUDriverMap.ASCEND,
    tips: ManufacturerMap[GPUDriverMap.ASCEND],
    locale: true
  },
  {
    label: 'DTK',
    value: GPUDriverMap.HYGON,
    tips: ManufacturerMap[GPUDriverMap.HYGON],
    locale: true
  },
  {
    label: 'MACA',
    value: GPUDriverMap.METAX,
    tips: ManufacturerMap[GPUDriverMap.METAX],
    locale: true
  },
  {
    label: 'CoreX',
    value: GPUDriverMap.ILUVATAR,
    tips: ManufacturerMap[GPUDriverMap.ILUVATAR],
    locale: true
  },
  {
    label: 'MUSA',
    value: GPUDriverMap.MOORE_THREADS,
    tips: ManufacturerMap[GPUDriverMap.MOORE_THREADS],
    locale: true
  },
  {
    label: 'Neuware',
    value: GPUDriverMap.CAMBRICON,
    tips: ManufacturerMap[GPUDriverMap.CAMBRICON],
    locale: true
  },
  {
    label: 'CPU',
    value: 'cpu'
  }
];

export const yamlTemplate = `# ----------------------------------------
# custom backend configuration template
# ----------------------------------------
# backend_name: 
#   - required
#   - must be endwith '-custom'
# version_configs:
#   - image_name: required
#   - run_command: required
#   - custom_framework:
#       - optional
#       - choose from: ${Object.values(GPUDriverMap).join(', ')}, CPU

backend_name: vllm-custom
description: this is my custom vllm backend
default_version: v0.11.0
health_check_path: /v1/models
default_backend_param:
  - --host
default_run_command: vllm serve {{model_path}} --port {{port}} --host {{worker_ip}} --served-model-name {{model_name}}
version_configs:
  v0.11.0:
    image_name: lm/vllm:latest
    run_command: vllm serve {{model_path}} --port {{port}} --host {{worker_ip}} --served-model-name {{model_name}}
    custom_framework: cuda
  v0.10.0:
    image_name: lm/vllm:test
    run_command:
    custom_framework:
  `;
