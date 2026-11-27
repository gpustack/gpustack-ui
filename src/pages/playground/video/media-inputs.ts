import { isReservedVideoParameter } from './advanced-parameters';

export type VideoMediaType = 'image' | 'video' | 'audio';
export type VideoMediaSource = File | string | undefined;
export type VideoReference = {
  type: VideoMediaType;
  source?: VideoMediaSource;
};
export type VideoMediaRules = {
  keyframes?: boolean;
  image?: number;
  video?: number;
  audio?: number;
  max_items?: number;
  requires_visual?: boolean;
};

export const emptyVideoMedia = {
  referenceImage: undefined,
  firstFrame: undefined,
  lastFrame: undefined,
  references: [] as VideoReference[]
};

export const getVideoMediaRules = (
  meta: Record<string, any> | undefined,
  task?: string
): VideoMediaRules => meta?.video?.media_inputs?.[task || ''] || {};

export const isVideoMediaSource = (value: VideoMediaSource) =>
  value instanceof File || (typeof value === 'string' && Boolean(value.trim()));

export const isValidVideoMediaUrl = (value: VideoMediaSource) => {
  if (value instanceof File || !value?.trim()) return true;
  try {
    const url = new URL(value.trim());
    return (
      /^https?:\/\//i.test(value.trim()) &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};

export const buildVideoParameters = (
  parameters: Record<string, any>,
  prompt: string,
  meta?: Record<string, any>,
  extensions: Record<string, unknown> = {}
) => {
  const { referenceImage, firstFrame, lastFrame, references } = parameters;
  const fields = {
    model: parameters.model,
    task: parameters.task,
    seconds: parameters.seconds,
    seed: parameters.seed,
    size: parameters.size
  };
  const result: Record<string, unknown> = {
    ...Object.fromEntries(
      Object.entries(extensions).filter(
        ([key]) => !isReservedVideoParameter(key)
      )
    ),
    ...Object.fromEntries(
      Object.entries(fields).filter(
        ([, value]) => value != null && value !== ''
      )
    )
  };
  if (parameters.size === 'default') delete result.size;
  if (parameters.aspectRatio === 'custom' || parameters.size === 'custom') {
    result.size =
      parameters.width && parameters.height
        ? `${parameters.width}x${parameters.height}`
        : '';
  }
  result.prompt = prompt;
  if (fields.task === 't2va') return result;
  const rules = getVideoMediaRules(meta, fields.task);
  const media: Record<string, unknown>[] = [];
  const add = (
    source: VideoMediaSource,
    descriptor: Record<string, unknown>
  ) => {
    if (!isVideoMediaSource(source)) return;
    if (source instanceof File) {
      const field = `media_${media.length}`;
      result[field] = source;
      media.push({ ...descriptor, upload_field: field });
    } else {
      media.push({ ...descriptor, uri: source!.trim() });
    }
  };
  if (rules.keyframes) {
    add(firstFrame, { type: 'image', role: 'keyframe', frame_index: 0 });
    add(lastFrame, { type: 'image', role: 'keyframe', frame_index: -1 });
  } else if (rules.max_items) {
    for (const reference of ((references || []) as VideoReference[]).slice(
      0,
      1
    )) {
      if (rules[reference.type])
        add(reference.source, { type: reference.type, role: 'reference' });
    }
  } else if (!meta?.video) {
    if (referenceImage instanceof File) result.input_reference = referenceImage;
    else if (referenceImage?.trim())
      result.reference_url = referenceImage.trim();
  }
  if (media.length) result.media_inputs = JSON.stringify(media);
  return result;
};
