const formFields = new Set([
  'model',
  'prompt',
  'task',
  'seed',
  'random_seed',
  'seconds',
  'duration',
  'duration_seconds',
  'duration_s',
  'size',
  'aspectRatio',
  'aspect_ratio',
  'width',
  'height',
  'advancedParameters',
  'referenceImage',
  'firstFrame',
  'lastFrame',
  'references',
  'input_reference',
  'input_references',
  'reference_url',
  'image_reference',
  'video_reference',
  'audio_reference',
  'conditions',
  'frame_indices',
  'media_inputs'
]);

export const isReservedVideoParameter = (key: string) =>
  formFields.has(key) || /^media_\d+$/.test(key);

const asObject = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const nativeObject = (value: unknown) => {
  try {
    return asObject(typeof value === 'string' ? JSON.parse(value) : value);
  } catch {
    return undefined;
  }
};

const getConflicts = (values: Record<string, unknown>, prefix = '') => {
  const conflicts = Object.keys(values)
    .filter(isReservedVideoParameter)
    .map((key) => prefix + key);
  const target = nativeObject(values.target);
  if (target) {
    for (const key of ['short_edge', 'aspect_ratio', 'duration_seconds']) {
      if (Object.hasOwn(target, key)) conflicts.push(`${prefix}target.${key}`);
    }
  }
  return conflicts;
};

export const parseVideoAdvancedParameters = (
  value?: string | null
):
  | { values: Record<string, unknown> }
  | { issue: 'invalid' }
  | { issue: 'conflict'; keys: string[] } => {
  let parsed: unknown;
  try {
    parsed = value?.trim() ? JSON.parse(value) : null;
  } catch {
    return { issue: 'invalid' };
  }
  if (parsed === null) return { values: {} };
  const values = asObject(parsed);
  if (!values) return { issue: 'invalid' };
  const keys = getConflicts(values);
  for (const wrapper of ['extra_body', 'extra_params']) {
    const nested = nativeObject(values[wrapper]);
    if (nested) keys.push(...getConflicts(nested, `${wrapper}.`));
  }
  return keys.length ? { issue: 'conflict', keys } : { values };
};

export const restoreVideoAdvancedParameters = (
  request: Record<string, unknown>
) => {
  const entries = Object.entries(request).filter(
    ([key, value]) => !isReservedVideoParameter(key) && !(value instanceof Blob)
  );
  return entries.length
    ? JSON.stringify(Object.fromEntries(entries), null, 2)
    : '';
};
