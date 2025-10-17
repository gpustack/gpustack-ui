import MindIELogo from '@/assets/logo/ascend.png';
import SGLangLogo from '@/assets/logo/sglang.png';
import vLLMLogo from '@/assets/logo/vllm.png';
import icons from '@/components/icon-font/icons';
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

export const builtInBackends = {
  SGLang: 'SGLang',
  vLLM: 'vLLM',
  MindIE: 'MindIE',
  VoxBox: 'voxbox'
};

export const builtInBackendLogos: Record<string, string> = {
  [builtInBackends.SGLang]: SGLangLogo,
  [builtInBackends.vLLM]: vLLMLogo,
  [builtInBackends.MindIE]: MindIELogo,
  [builtInBackends.VoxBox]: ''
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
  corex: 'purple'
};

export const getGpuColor = (gpuType: string) => {
  if (!gpuType) return 'default';

  if (gpuType.includes('cann')) return gpuColorMap['cann'];
  if (gpuType.includes('cuda')) return gpuColorMap['cuda'];
  if (gpuType.includes('rocm')) return gpuColorMap['rocm'];
  if (gpuType.includes('dtk')) return gpuColorMap['dtk'];
  if (gpuType.includes('musa')) return gpuColorMap['musa'];
  if (gpuType.includes('corex')) return gpuColorMap['corex'];

  return 'default';
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

export const backendFields = [
  'description',
  'health_check_path',
  'default_run_command',
  'version_configs',
  'default_backend_param'
];
export const frameworks = [
  {
    label: 'CUDA',
    value: 'cuda'
  },
  {
    label: 'ROCm',
    value: 'rocm'
  },
  {
    label: 'CANN',
    value: 'cann'
  },
  {
    label: 'DTK',
    value: 'dtk'
  },
  {
    label: 'CoreX',
    value: 'corex'
  },
  {
    label: 'CPU',
    value: 'cpu'
  }
];

export const yamlTemplate = `# backend configuration template
backend_name: my-backend
description: this is my-backend
default_version: v0.5.1
health_check_path: /health
default_backend_param:
  - --host
default_run_command: myBackend serve {model} --port {port}
version_configs:
  v0.0.1:
    image_name: lm/mybackend:latest
    run_command: myBackend serve {model} --port {port}
    custom_framework: cuda
  v0.0.2:
    image_name: lm/mybackend:test
    run_command:
    custom_framework:
  `;
