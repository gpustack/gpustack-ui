import _ from 'lodash';
import { GPUTypeSelector, ModelInstanceListItem } from '../../config/types';

// Minimal shape of the useIntl() result we depend on — keeps this module
// free of an intl package import (mirrors gpu-service render-instance-type).
type IntlLike = {
  formatMessage: (
    descriptor: { id: string },
    values?: Record<string, any>
  ) => string;
};

// A vGPU instance is one whose model carries a gpu_type_selector (deployed
// via an InstanceType). The selector is model-level and identical for all of
// the model's instances — each worker holds one slice of the same type — so
// it is read off the parent model; the instance's own echo (if the API ever
// provides one) takes precedence.
export const getGPUTypeSelector = (
  record: ModelInstanceListItem,
  modelData?: any
): GPUTypeSelector | null | undefined => {
  return record?.gpu_type_selector || modelData?.gpu_type_selector;
};

// The cluster whose instance types the selector's `type` names — needed to
// resolve its display name (see useGPUTypeDisplayName). Read off the instance,
// falling back to the parent model.
export const getGPUTypeClusterId = (
  record: ModelInstanceListItem,
  modelData?: any
): number | undefined => {
  return record?.cluster_id ?? modelData?.cluster_id;
};

// Compact "<gpu type> (<allocation>)" label for an instance's vGPU allocation:
// - partitioned: "<gpu type> (<profile>)" — hardware partition (e.g. MIG)
// - sliced: "<gpu type> (<memory>% VRAM / <cores>% Compute)" — soft slice
// - whole card from the type pool: "<gpu type> (Full GPU)"
// The GPU type reads as its display name — the deployment records only the
// type's name, so the caller resolves the display name and passes it in; it
// falls back to the name while that is still loading, or when the type carries
// none. Returns '' for non-vGPU instances so callers can gate rendering on it.
export const formatGPUTypeAllocation = (
  intl: IntlLike,
  selector?: GPUTypeSelector | null,
  typeDisplayName?: string
): string => {
  if (!selector?.type) {
    return '';
  }

  const type = typeDisplayName || selector.type;
  const profile = selector.accelerator_partitioned_profile;
  if (profile) {
    return `${type} (${profile})`;
  }

  const memory = _.toNumber(selector.accelerator_sliced_memory_percentage) || 0;
  const cores = _.toNumber(selector.accelerator_sliced_cores_percentage) || 0;
  if (memory > 0 || cores > 0) {
    const slice = intl.formatMessage(
      { id: 'models.table.vgpu.slice' },
      { memory, cores }
    );
    return `${type} (${slice})`;
  }

  return `${type} (${intl.formatMessage({ id: 'gpuservice.instance.mode.whole' })})`;
};
