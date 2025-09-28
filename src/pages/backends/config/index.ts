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
  vLLM: 'vllm',
  MindIE: 'mindie',
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
    label: 'Edit',
    value: 'edit',
    key: 'edit',
    icon: icons.EditOutlined,
    locale: false
  },
  {
    label: 'Export YAML',
    value: 'yaml',
    key: 'export',
    icon: icons.Yaml,
    locale: false
  },
  {
    label: 'Delete',
    value: 'delete',
    key: 'delete',
    icon: icons.DeleteOutlined,
    locale: false,
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

export const customIcons = ['∑', '∏', '∫', '∂', '∞', 'θ', '∆', '∇'];

export const backendFields = [
  'description',
  'health_check_path',
  'default_run_command',
  'version_configs',
  'default_backend_parameters'
];

export const yamlTemplate = `# backend configuration template
backend_name: SGLang
description: SGLang backend
default_version: v0.5.1
health_check_path: /health
default_run_command: run sglang
version_configs:
  v0.0.1:
    image_name: lm/sglang
    run_command: run sglang
  v0.0.2:
    image_name: lm/sglang
    run_command: run sglang
default_backend_parameters:
  - --host
  `;
