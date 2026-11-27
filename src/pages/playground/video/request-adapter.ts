export interface VideoCapabilities {
  family?: string;
  request_profile?: 'sglang_h3' | 'vllm_omni_h3' | string;
  tasks?: string[];
  default_task?: string | null;
  default_size?: string;
  media_inputs?: Record<
    string,
    {
      keyframes?: boolean;
      image?: number;
      video?: number;
      audio?: number;
      max_items?: number;
      requires_visual?: boolean;
    }
  >;
}

export interface InlineVideoMedia {
  field: string;
  env: string;
  mime: string;
  placeholder: string;
}

const ASPECT_RATIOS: ReadonlyArray<
  readonly [string, readonly [number, number]]
> = [
  ['21:9', [21, 9]],
  ['16:9', [16, 9]],
  ['4:3', [4, 3]],
  ['1:1', [1, 1]],
  ['3:4', [3, 4]],
  ['9:16', [9, 16]]
];

const REFERENCE_FIELDS = [
  'input_reference',
  'input_references',
  'reference_url',
  'image_reference',
  'video_reference',
  'audio_reference'
] as const;

const EXTENSION_KEYS = [
  'task',
  'target',
  'conditions',
  'aspect_ratio',
  'duration',
  'duration_seconds'
] as const;

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  wav: 'audio/wav',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  aac: 'audio/aac'
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  !(value instanceof Blob);

const parseObject = (
  value: unknown,
  field: string
): Record<string, unknown> => {
  if (value === undefined || value === null || value === '') return {};
  let parsed = value;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      throw new Error(`${field} must be a JSON object`);
    }
  }
  if (!isPlainObject(parsed)) {
    throw new Error(`${field} must be a JSON object`);
  }
  return { ...parsed };
};

const deepEqual = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right);

const parseCanvas = (size: unknown): { shortEdge: number; ratio: string } => {
  const match = /^([1-9]\d*)x([1-9]\d*)$/.exec(String(size ?? ''));
  if (!match) {
    throw new Error('size must use positive WIDTHxHEIGHT dimensions');
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  let best = ASPECT_RATIOS[0];
  let bestDiff = Infinity;
  for (const candidate of ASPECT_RATIOS) {
    const [x, y] = candidate[1];
    const diff = Math.abs(width / height - x / y);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }
  const [name, [x, y]] = best;
  // Published H3 canvases are aligned to 32 pixels, including 1344x768.
  if (
    Math.min(
      Math.abs(width - (height * x) / y),
      Math.abs(height - (width * y) / x)
    ) > 32
  ) {
    throw new Error('MiniMax H3 size must use a supported aspect ratio');
  }
  return { shortEdge: Math.min(width, height), ratio: name };
};

const parseDuration = (value: unknown): number => {
  if (typeof value === 'boolean' || value === '' || value === null) {
    throw new Error('seconds must be between 4 and 15 for MiniMax H3');
  }
  const duration = Number(value);
  if (!Number.isFinite(duration)) {
    throw new Error('seconds must be between 4 and 15 for MiniMax H3');
  }
  if (duration < 4 || duration > 15 || !Number.isInteger(duration)) {
    throw new Error(
      'seconds must be between 4 and 15 in whole seconds for MiniMax H3'
    );
  }
  return duration;
};

const extractExtensionParameters = (
  values: Record<string, unknown>
): Record<string, unknown> => {
  const extraBody = parseObject(values.extra_body, 'extra_body');
  delete values.extra_body;
  const extraParams = parseObject(values.extra_params, 'extra_params');
  delete values.extra_params;

  for (const key of Object.keys(extraBody)) {
    if (
      Object.hasOwn(extraParams, key) &&
      !deepEqual(extraBody[key], extraParams[key])
    ) {
      throw new Error(`Conflicting video parameter: ${key}`);
    }
  }
  const extras: Record<string, unknown> = { ...extraBody, ...extraParams };
  if (Object.hasOwn(extras, 'model') || Object.hasOwn(extras, 'prompt')) {
    throw new Error('model and prompt must be top-level video parameters');
  }

  for (const key of EXTENSION_KEYS) {
    if (!Object.hasOwn(values, key)) continue;
    let value = values[key];
    delete values[key];
    if (
      (key === 'target' || key === 'conditions') &&
      typeof value === 'string'
    ) {
      try {
        value = JSON.parse(value);
      } catch {
        throw new Error(`${key} must be valid JSON`);
      }
    }
    if (Object.hasOwn(extras, key) && !deepEqual(extras[key], value)) {
      throw new Error(`Conflicting video parameter: ${key}`);
    }
    extras[key] = value;
  }
  return extras;
};

const resolveMimeType = (file: File): string => {
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return MIME_BY_EXT[ext] || '';
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const fileToDataUri = async (file: File, kind: string): Promise<string> => {
  const mime = resolveMimeType(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!bytes.length || !mime || !mime.startsWith(`${kind}/`)) {
    throw new Error('Invalid reference content type or empty upload');
  }
  return `data:${mime};base64,${bytesToBase64(bytes)}`;
};

const validateHttpUri = (uri: unknown): string => {
  if (typeof uri === 'string') {
    try {
      const parsed = new URL(uri);
      if (
        (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
        parsed.hostname &&
        !parsed.username &&
        !parsed.password
      ) {
        return uri;
      }
    } catch {
      // Fall through to error.
    }
  }
  throw new Error('Reference URLs must use HTTP(S) without credentials');
};

const isH3Profile = (
  capabilities?: VideoCapabilities
): capabilities is VideoCapabilities & {
  request_profile: 'sglang_h3' | 'vllm_omni_h3';
} =>
  capabilities?.request_profile === 'sglang_h3' ||
  capabilities?.request_profile === 'vllm_omni_h3';

type UploadResolver = (file: File, kind: string, field: string) => string;

const adaptH3Core = (
  parameters: Record<string, unknown>,
  capabilities: VideoCapabilities & {
    request_profile: 'sglang_h3' | 'vllm_omni_h3';
  },
  resolveUpload: UploadResolver
): Record<string, unknown> => {
  const values: Record<string, unknown> = { ...parameters };
  const extras = extractExtensionParameters(values);

  for (const container of [values, extras]) {
    for (const key of REFERENCE_FIELDS) {
      const value = container[key];
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && !value.trim())
      ) {
        delete container[key];
      }
    }
  }

  const hasCommonMedia = Object.hasOwn(values, 'media_inputs');
  if (hasCommonMedia) {
    let entries: unknown = values.media_inputs;
    delete values.media_inputs;
    if (typeof entries === 'string') {
      try {
        entries = JSON.parse(entries);
      } catch {
        throw new Error('media_inputs must be a JSON array');
      }
    }
    const task =
      extras.task !== undefined ? extras.task : capabilities.default_task;
    const rules =
      typeof task === 'string' ? capabilities.media_inputs?.[task] : undefined;
    if (
      !rules ||
      !Array.isArray(entries) ||
      entries.length === 0 ||
      (rules.max_items != null && entries.length > rules.max_items)
    ) {
      throw new Error(
        'Provide compatible reference inputs for this video task'
      );
    }
    const hasNativeRef =
      Boolean(extras.conditions) ||
      REFERENCE_FIELDS.some(
        (key) => values[key] !== undefined || extras[key] !== undefined
      );
    if (hasNativeRef) {
      throw new Error(
        'Do not combine media_inputs with native reference parameters'
      );
    }

    const conditions: Record<string, unknown>[] = [];
    const indices: number[] = [];
    const counts: Record<'image' | 'video' | 'audio', number> = {
      image: 0,
      video: 0,
      audio: 0
    };
    const consumed = new Set<string>();

    for (const entry of entries) {
      if (!isPlainObject(entry)) {
        throw new Error('Invalid reference media entry');
      }
      const kind = entry.type;
      const role = entry.role;
      if (kind !== 'image' && kind !== 'video' && kind !== 'audio') {
        throw new Error('Unsupported reference media type');
      }
      const condition: Record<string, unknown> = { type: kind, role };
      counts[kind] += 1;
      if (rules.keyframes) {
        const index = entry.frame_index;
        if (
          kind !== 'image' ||
          role !== 'keyframe' ||
          typeof index !== 'number' ||
          !Number.isInteger(index) ||
          (index !== 0 && index !== -1)
        ) {
          throw new Error('FL2VA requires first/last image keyframes');
        }
        condition.frame_index = index;
        indices.push(index);
      } else if (role !== 'reference' || counts[kind] > (rules[kind] || 0)) {
        throw new Error('Unsupported reference media role or count');
      }

      if (Object.hasOwn(entry, 'upload_field')) {
        const field = entry.upload_field;
        const file = typeof field === 'string' ? values[field] : undefined;
        if (
          typeof field !== 'string' ||
          !(file instanceof File) ||
          consumed.has(field) ||
          entry.uri != null
        ) {
          throw new Error(
            'Each reference must identify a distinct nonempty upload'
          );
        }
        consumed.add(field);
        condition.uri = resolveUpload(file, kind, field);
      } else {
        condition.uri = validateHttpUri(entry.uri);
      }
      conditions.push(condition);
    }

    if (rules.keyframes) {
      const validOrder =
        (indices.length === 1 && (indices[0] === 0 || indices[0] === -1)) ||
        (indices.length === 2 && indices[0] === 0 && indices[1] === -1);
      if (!validOrder) {
        throw new Error(
          'Keyframes must be ordered first, last without duplicates'
        );
      }
    }
    if (rules.requires_visual && !counts.image && !counts.video) {
      throw new Error('Provide at least one reference image or video');
    }

    for (const field of consumed) {
      delete values[field];
    }
    extras.task = task;
    if (capabilities.request_profile === 'sglang_h3') {
      extras.conditions = conditions;
    } else {
      for (const kind of ['image', 'video', 'audio'] as const) {
        if (counts[kind]) {
          values[`${kind}_reference`] = conditions
            .filter((item) => item.type === kind)
            .map((item) => ({ [`${kind}_url`]: item.uri }));
        }
      }
      if (indices.length) {
        if (Object.hasOwn(extras, 'frame_indices')) {
          throw new Error('Do not combine media_inputs with frame_indices');
        }
        extras.frame_indices = indices;
      }
    }
  }

  let task = extras.task;
  const hasReference =
    REFERENCE_FIELDS.some(
      (key) => values[key] !== undefined || extras[key] !== undefined
    ) || Boolean(extras.conditions);

  if (task === undefined && hasReference) {
    if (capabilities.request_profile === 'vllm_omni_h3') {
      return { ...values, extra_params: extras };
    }
    throw new Error(
      'MiniMax H3 references require an explicit task and model-specific reference parameters'
    );
  }

  task = task === undefined ? capabilities.default_task : task;
  const supportedTasks = capabilities.tasks || [];
  if (typeof task !== 'string' || !supportedTasks.includes(task)) {
    throw new Error(
      `MiniMax H3 task must be one of ${JSON.stringify(supportedTasks)}`
    );
  }
  if (task === 't2va' && hasReference) {
    throw new Error(
      'MiniMax H3 t2va accepts text only; remove reference inputs'
    );
  }
  extras.task = task;

  if (task !== 't2va' && !hasCommonMedia) {
    return capabilities.request_profile === 'sglang_h3'
      ? { ...extras, ...values }
      : { ...values, extra_params: extras };
  }

  if (capabilities.request_profile === 'sglang_h3') {
    const target = parseObject(extras.target, 'target');
    if (
      !Object.hasOwn(target, 'short_edge') ||
      !Object.hasOwn(target, 'aspect_ratio')
    ) {
      const { shortEdge, ratio } = parseCanvas(
        values.size || capabilities.default_size
      );
      if (!Object.hasOwn(target, 'short_edge')) target.short_edge = shortEdge;
      if (!Object.hasOwn(target, 'aspect_ratio')) {
        target.aspect_ratio =
          extras.task === 'fl2va' && !values.size ? 'auto' : ratio;
      }
    }
    if (!Object.hasOwn(target, 'duration_seconds')) {
      target.duration_seconds = parseDuration(values.seconds ?? 4);
    }
    extras.target = target;
    if (extras.task === 't2va' && !Object.hasOwn(extras, 'conditions')) {
      extras.conditions = [];
    }
    return { ...extras, ...values };
  }

  const target = parseObject(extras.target, 'target');
  if (!target.aspect_ratio && !Object.hasOwn(extras, 'aspect_ratio')) {
    const { ratio } = parseCanvas(values.size || capabilities.default_size);
    extras.aspect_ratio = ratio;
  }
  if (
    !Object.hasOwn(extras, 'duration') &&
    !Object.hasOwn(extras, 'duration_seconds') &&
    !Object.hasOwn(target, 'duration_seconds') &&
    (values.seconds !== undefined || values.num_frames === undefined)
  ) {
    extras.duration = parseDuration(values.seconds ?? 4);
  }
  return { ...values, extra_params: extras };
};

/**
 * Translate canonical Playground video parameters into the target engine's
 * native `/v1/videos` request fields (encoding uploaded H3 references as base64
 * data URIs). Non-H3 models pass through untouched.
 */
export const adaptVideoRequest = async (
  parameters: Record<string, unknown>,
  capabilities?: VideoCapabilities
): Promise<Record<string, unknown>> => {
  if (!isH3Profile(capabilities)) return parameters;
  const pendingUploads: Array<{ field: string; file: File; kind: string }> = [];
  const placeholderMap = new Map<string, string>();

  const adapted = adaptH3Core(parameters, capabilities, (file, kind, field) => {
    const token = `__GPUSTACK_PENDING_${field}__`;
    pendingUploads.push({ field, file, kind });
    placeholderMap.set(field, token);
    return token;
  });

  if (!pendingUploads.length) return adapted;

  const encoded = new Map<string, string>();
  await Promise.all(
    pendingUploads.map(async ({ field, file, kind }) => {
      encoded.set(placeholderMap.get(field)!, await fileToDataUri(file, kind));
    })
  );

  const replaceTokens = (value: unknown): unknown => {
    if (typeof value === 'string') return encoded.get(value) ?? value;
    if (Array.isArray(value)) return value.map(replaceTokens);
    if (isPlainObject(value)) {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, replaceTokens(v)])
      );
    }
    return value;
  };

  return replaceTokens(adapted) as Record<string, unknown>;
};

/**
 * Synchronous variant for View Code generation: lowers H3 parameters while
 * replacing uploaded file references with placeholders so the generated curl,
 * Python, and Node.js snippets read and base64-encode local files at runtime.
 */
export const adaptVideoRequestForCode = (
  parameters: Record<string, unknown>,
  capabilities?: VideoCapabilities
): {
  parameters: Record<string, unknown>;
  inlineMedia: InlineVideoMedia[];
} => {
  if (!isH3Profile(capabilities)) {
    return { parameters, inlineMedia: [] };
  }
  const inlineMedia: InlineVideoMedia[] = [];
  try {
    const adapted = adaptH3Core(
      parameters,
      capabilities,
      (file, kind, field) => {
        const env = `${field.toUpperCase()}_PATH`;
        const mime = resolveMimeType(file) || `${kind}/octet-stream`;
        const placeholder = `__GPUSTACK_DATA_URI_${env}__`;
        inlineMedia.push({ field, env, mime, placeholder });
        return placeholder;
      }
    );
    return { parameters: adapted, inlineMedia };
  } catch {
    return { parameters, inlineMedia: [] };
  }
};
