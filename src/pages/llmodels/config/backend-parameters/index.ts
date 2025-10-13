import llamaParameters from './llama-parameters';
import mindieParameters from './mindie-parameters';
import vllmParameters from './vllm-parameters';

export const backendOptionsMap = {
  llamaBox: 'llama-box',
  vllm: 'vLLM',
  voxBox: 'vox-box',
  ascendMindie: 'MindIE',
  custom: 'Custom'
};

export interface BackendParameter {
  label: string;
  value: string;
  options?: Array<string | number>;
}

const generateBackendParameters = (options: BackendParameter[]) => {
  return options.map((option) => {
    return {
      label: option.label,
      value: option.value,
      opts: option.options?.map((opt) => {
        return {
          label: opt,
          value: opt
        };
      })
    };
  });
};

export default {
  [backendOptionsMap.llamaBox]: generateBackendParameters(llamaParameters),
  [backendOptionsMap.vllm]: generateBackendParameters(vllmParameters),
  [backendOptionsMap.ascendMindie]: generateBackendParameters(mindieParameters),
  [backendOptionsMap.voxBox]: [],
  [backendOptionsMap.custom]: []
};
