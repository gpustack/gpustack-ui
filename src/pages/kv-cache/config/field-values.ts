import type { CacheProviderField } from './types';

// Match the backend's template values, including chained visibility gates.
// Visibility alone does not change a value; only a declared gated_default does.
export const resolvedFieldValues = (
  fields: CacheProviderField[] = [],
  values: Record<string, any> = {}
) => {
  const declared = new Map(fields.map((field) => [field.name, field]));
  const resolved: Record<string, any> = {};
  const resolving = new Set<string>();
  const resolve = (field: CacheProviderField): any => {
    if (Object.hasOwn(resolved, field.name)) {
      return resolved[field.name];
    }
    let value =
      Object.hasOwn(values, field.name) && values[field.name] !== undefined
        ? values[field.name]
        : field.default;
    if (field.visible_by && field.gated_default != null) {
      const gate = declared.get(field.visible_by);
      let gateValue = values[field.visible_by];
      if (gate && !resolving.has(field.name)) {
        resolving.add(field.name);
        gateValue = resolve(gate);
        resolving.delete(field.name);
      }
      if (gateValue !== field.visible_when) {
        value = field.gated_default;
      }
    }
    resolved[field.name] = value;
    return value;
  };
  fields.forEach(resolve);
  return resolved;
};

export const resolveFieldValue = (
  name: string | undefined,
  fields: CacheProviderField[] | undefined,
  values?: Record<string, any> | null
) => {
  if (!name) {
    return undefined;
  }
  const resolved = resolvedFieldValues(fields, values || {});
  return Object.hasOwn(resolved, name) ? resolved[name] : values?.[name];
};
