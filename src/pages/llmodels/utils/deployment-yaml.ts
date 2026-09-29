import yaml from 'js-yaml';

// The server projects configuration in schema order. Preserve that order and
// keep long values and repeated objects readable without folds or YAML anchors.
export const dumpDeploymentConfig = (value: Record<string, unknown>): string =>
  Object.keys(value || {}).length
    ? yaml.dump(value, { lineWidth: -1, noRefs: true })
    : '';
