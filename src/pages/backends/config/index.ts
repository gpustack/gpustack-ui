import MindIELogo from '@/assets/logo/ascend.png';
import SGLangLogo from '@/assets/logo/sglang.png';
import vLLMLogo from '@/assets/logo/vllm.png';
import VoxBoxLogo from '@/assets/logo/voxbox.png';
import { backendOptionsMap } from '@/pages/llmodels/constants/backend-parameters';
import {
  GPUDriverMap,
  ManufacturerMap
} from '@/pages/resources/config/gpu-driver';
import { icons } from '@gpustack/core-ui';
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

export const BackendSourceValueMap = {
  CUSTOM: 'custom',
  BUILTIN: 'built_in',
  COMMUNITY: 'community',
  USER_DEFINED: 'user_defined'
};

export const BackendSourceLabelMap: Record<string, string> = {
  [BackendSourceValueMap.CUSTOM]: 'backend.custom',
  [BackendSourceValueMap.BUILTIN]: 'backend.builtin',
  [BackendSourceValueMap.COMMUNITY]: 'backend.community',
  [BackendSourceValueMap.USER_DEFINED]: 'models.form.backend.custom'
};

export const TagColorMap: Record<string, string> = {
  [BackendSourceValueMap.CUSTOM]: 'purple',
  [BackendSourceValueMap.BUILTIN]: 'geekblue',
  [BackendSourceValueMap.COMMUNITY]: 'cyan'
};

export const backendSourceOptions = [
  {
    label: BackendSourceLabelMap[BackendSourceValueMap.BUILTIN],
    value: BackendSourceValueMap.BUILTIN,
    locale: true
  },
  {
    label: BackendSourceLabelMap[BackendSourceValueMap.COMMUNITY],
    value: BackendSourceValueMap.COMMUNITY,
    locale: true
  },
  {
    label: BackendSourceLabelMap[BackendSourceValueMap.CUSTOM],
    value: BackendSourceValueMap.CUSTOM,
    locale: true
  }
];

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
  // {
  //   label: 'common.button.enable',
  //   value: 'enable',
  //   key: 'enable',
  //   locale: true,
  //   icon: icons.Charger,
  //   show: (record: any) =>
  //     !record.enabled &&
  //     record.backend_source === BackendSourceValueMap.COMMUNITY
  // },
  // {
  //   label: 'common.button.disable',
  //   value: 'disable',
  //   key: 'disable',
  //   locale: true,
  //   icon: icons.Disabled,
  //   show: (record: any) =>
  //     record.enabled &&
  //     record.backend_source === BackendSourceValueMap.COMMUNITY
  // },
  {
    label: 'common.button.delete',
    value: 'delete',
    key: 'delete',
    icon: icons.DeleteOutlined,
    locale: true,
    danger: true,
    // Platform built-ins are admin-curated and not user-deletable.
    // An org-scoped override of a built-in IS deletable — deleting
    // the override is how the user reverts to the Platform row.
    // Plain custom backends are always deletable.
    show: (record: any) =>
      !record.is_built_in || record.owner_principal_id != null
  }
];

export const json2Yaml = (obj: Record<string, any>) => {
  try {
    if (!obj || !Object.keys(obj).length) return '';
    const res = jsYaml.dump(JSON.parse(JSON.stringify(obj)));
    return res;
  } catch (error) {
    console.error('json2Yaml error:', error);
    return '';
  }
};

export const yaml2Json = (input: string) => {
  try {
    const str = trim(input);
    const obj = jsYaml.load(str, { schema: SEAL_SCHEMA });
    if (typeof obj !== 'object' || obj === null) {
      return {};
    }
    const jsonStr = JSON.stringify(obj);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('yaml2Json error:', error);
    return {};
  }
};

/**
 * Decorative hues for a custom backend's icon tile, picked by HASH — which is
 * why every SEMANTIC hue is excluded here. The list used to include `red`,
 * `orange`, `gold`, `volcano` and `green`, so a backend whose name happened to
 * hash onto `red` wore a badge reading "errored" and one onto `green` read
 * "healthy", for no reason anyone could act on. `TagColorMap` above was already
 * doing it right (purple / geekblue / cyan); this now matches it.
 *
 * `gpuColorMap` below keeps its semantic hues on purpose — it is a deliberate
 * per-framework mapping, not a hash, so the hue means something.
 */
export const customColors = [
  'geekblue',
  'purple',
  'cyan',
  'blue',
  'magenta',
  'lime'
];

/**
 * Stable index for a backend's decorative icon/colour.
 *
 * Keyed on the backend NAME, not the database `id`. `id % n` meant the same
 * backend wore a different colour and glyph in every environment (and shifted
 * again after a re-seed), so the cue it was supposed to provide — "this is the
 * same thing I saw last time" — was the one thing it could not deliver.
 */
export const backendVisualIndex = (name: string, buckets: number): number => {
  if (!name || buckets <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % buckets;
};

/**
 * One hue per GPU framework — a fixed, hand-picked mapping, unlike the hashed
 * `customColors` above.
 *
 * These deliberately KEEP the semantic hues (`green`, `volcano`, `orange`,
 * `gold`). Re-drawing them from the non-semantic set was tried and reverted:
 * the set only holds six usable presets, so two frameworks had to collapse to a
 * neutral grey and lost their identity — a worse outcome than the collision it
 * was avoiding. And the collision is largely theoretical here: the backend card
 * that renders these tags shows no status of its own, and `cuda: green` /
 * `rocm: volcano` echo the vendors' own brand colours rather than picking a hue
 * at random. Identity beats hue purity when the hue carries real meaning.
 */
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
  'default_backend_param',
  'parameter_format',
  'common_parameters',
  'default_env'
];

/**
 * built-in backend fields for config yaml
 */
export const builtInBackendFields = [
  'description',
  'version_configs',
  'default_backend_param',
  'parameter_format',
  'common_parameters',
  'default_env'
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
    tipLocale: true
  },
  {
    label: 'DTK',
    value: GPUDriverMap.HYGON,
    tips: ManufacturerMap[GPUDriverMap.HYGON],
    tipLocale: true
  },
  {
    label: 'MACA',
    value: GPUDriverMap.METAX,
    tips: ManufacturerMap[GPUDriverMap.METAX],
    tipLocale: true
  },
  {
    label: 'CoreX',
    value: GPUDriverMap.ILUVATAR,
    tips: ManufacturerMap[GPUDriverMap.ILUVATAR],
    tipLocale: true
  },
  {
    label: 'MUSA',
    value: GPUDriverMap.MOORE_THREADS,
    tips: ManufacturerMap[GPUDriverMap.MOORE_THREADS],
    tipLocale: true
  },
  {
    label: 'Neuware',
    value: GPUDriverMap.CAMBRICON,
    tips: ManufacturerMap[GPUDriverMap.CAMBRICON],
    tipLocale: true
  },
  {
    label: 'HGGC',
    value: GPUDriverMap.THEAD,
    tips: ManufacturerMap[GPUDriverMap.THEAD],
    tipLocale: true
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
#   - run_command: optional
#   - entrypoint: optional
#   - custom_framework:
#       - required
#       - choose from: ${Object.values(GPUDriverMap).join(', ')}, cpu
#   - env: optional, map of env key and value

backend_name: vllm-custom
description: this is my custom vllm backend
default_version: v0.11.0
health_check_path: /v1/models
default_backend_param:
  - --host
parameter_format: space
common_parameters:
  - --max-model-len
  - --gpu-memory-utilization
default_run_command: "{{model_path}} --port {{port}} --host {{worker_ip}} --served-model-name {{model_name}}"
default_env:
version_configs:
  v0.11.0:
    image_name: lm/vllm:latest
    run_command: "{{model_path}} --port {{port}} --host {{worker_ip}} --served-model-name {{model_name}}"
    entrypoint: "/bin/sh -c"
    custom_framework: cuda
    env:
  v0.10.0:
    image_name: lm/vllm:test
    entrypoint: 
    run_command:
    custom_framework: rocm
    env:
  `;

// Schema hint seeded into the community backend source editor. Mirrors the
// packaged community-inference-backends.yaml: a list of backend configs, each
// keyed by backend_name with at least one version_configs entry carrying an
// image_name. Comments only, so it cannot be saved unedited.
export const backendSourceTemplate = `# A YAML list of community backend configs.
#
# Required per entry:
#   backend_name     unique name of the backend
#   version_configs  map of version name -> config, each with an image_name
#
# Example:
#
# - backend_name: Kokoro-FastAPI
#   description: Inference backend serving the Kokoro TTS model.
#   # icon must be an absolute URL, a '/'-rooted path, or a raster data: URI
#   icon: https://example.com/icons/kokoro.png
#   health_check_path: /health
#   default_version: latest-gpu
#   version_configs:
#     latest-gpu:
#       image_name: ghcr.io/remsky/kokoro-fastapi-gpu:latest
#       custom_framework: cuda
#     latest-cpu:
#       image_name: ghcr.io/remsky/kokoro-fastapi-cpu:latest
#       custom_framework: cpu
`;
