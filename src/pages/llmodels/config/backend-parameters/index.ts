// preset backend parameters for built-in backends
import llamaParameters from './llama';
import mindieParameters from './mindie';
import sglangParameters from './sglang';
import vllmParameters from './vllm';

export const backendOptionsMap = {
  llamaBox: 'llama-box',
  vllm: 'vLLM',
  voxBox: 'VoxBox',
  ascendMindie: 'MindIE',
  custom: 'Custom',
  SGLang: 'SGLang'
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
  [backendOptionsMap.custom]: [],
  [backendOptionsMap.SGLang]: generateBackendParameters(sglangParameters)
};
