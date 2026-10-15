import type { FormInstance } from 'antd';
import omit from 'lodash/omit';
import type { FormData } from '../../config/types';

export function getCatalogFormValues<T extends Partial<FormData>>(
  form: Partial<Pick<FormInstance, 'getFieldsValue'>> | null | undefined,
  values: T
): Partial<FormData> & T {
  // The store holds catalog source fields. Submitted values own normalized
  // roles and selectors, including an explicit null when PD is disabled.
  const stored = form?.getFieldsValue?.(true) ?? {};
  const result = {
    ...omit(stored, ['scheduleType', 'manualGpuMode', 'pdMode']),
    ...values
  };
  if (!result.roles?.length) {
    return result;
  }
  // PD hides model-level controls. With preserve=false their unmount can
  // remove clears or restore initialValues, so encode the clears in the
  // request itself. Role overrides remain the source of runtime settings.
  return {
    ...result,
    backend_parameters: [],
    env: {},
    worker_selector: {},
    gpu_selector: null,
    gpu_type_selector: null,
    placement_strategy: undefined,
    extended_kv_cache: { ...result.extended_kv_cache, enabled: false },
    lora_list: []
  };
}
