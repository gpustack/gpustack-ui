import type { RuntimeChoice } from '../../config/types';

export const resolveRuntimeChoice = (
  selected: Partial<RuntimeChoice> = {},
  fallback: Partial<RuntimeChoice> = {}
): RuntimeChoice => {
  if (selected.image_name) {
    return {
      image_name: selected.image_name,
      backend_version: null,
      run_command: selected.run_command || null
    };
  }
  if (selected.backend_version) {
    return {
      image_name: null,
      backend_version: selected.backend_version,
      run_command: selected.run_command || null
    };
  }
  if (fallback.image_name) {
    return {
      image_name: fallback.image_name,
      backend_version: null,
      run_command: fallback.run_command || null
    };
  }
  return {
    image_name: null,
    backend_version: fallback.backend_version || null,
    run_command: fallback.run_command || null
  };
};
