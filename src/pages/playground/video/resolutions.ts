import { SizeOption } from '../config/params-config';
import {
  formatVideoSizeLabel,
  videoAspectRatios,
  videoSizeOptions
} from '../config/video-parameters';

export const parseVideoSize = (value?: string) => {
  if (!value || !/^[1-9]\d*x[1-9]\d*$/.test(value)) return undefined;
  const [width, height] = value.split('x').map(Number);
  return Number.isSafeInteger(width) && Number.isSafeInteger(height)
    ? { width, height }
    : undefined;
};

export const getVideoAspectRatio = (width: number, height: number) => {
  const closest = videoAspectRatios.reduce((best, ratio) =>
    Math.abs(width / height - ratio.width / ratio.height) <
    Math.abs(width / height - best.width / best.height)
      ? ratio
      : best
  );
  // Keep the exact model canvas while grouping nearby aligned sizes together.
  const distance = Math.min(
    Math.abs(width - (height * closest.width) / closest.height),
    Math.abs(height - (width * closest.height) / closest.width)
  );
  return distance <= 32 ? closest.label : 'custom';
};

export const getDefaultVideoSize = (meta: Record<string, any> = {}) =>
  parseVideoSize(meta.video?.default_size) ||
  (meta.default_width && meta.default_height
    ? parseVideoSize(`${meta.default_width}x${meta.default_height}`)
    : undefined);

export const getVideoSizeOptions = (meta: Record<string, any> = {}) => {
  // These are UI shortcuts, not a whitelist inferred from a model family.
  const options = [...videoSizeOptions];
  const defaults = getDefaultVideoSize(meta);
  if (defaults) {
    const value = `${defaults.width}x${defaults.height}`;
    if (!options.some((option) => option.value === value)) {
      options.push({
        ...defaults,
        value,
        label: formatVideoSizeLabel(defaults.width, defaults.height)
      });
    }
  }
  return options
    .filter(
      ({ width, height }) =>
        getVideoAspectRatio(width, height) !== 'custom' &&
        (!meta.max_width || width <= meta.max_width) &&
        (!meta.max_height || height <= meta.max_height)
    )
    .sort((a, b) => a.width * a.height - b.width * b.height);
};

export const getSizesForVideoRatio = (options: SizeOption[], ratio: string) =>
  options.filter(
    ({ width, height }) => getVideoAspectRatio(width, height) === ratio
  );

export const selectVideoSize = (
  options: SizeOption[],
  previous: { width: number; height: number }
) => {
  const shortEdge = Math.min(previous.width, previous.height);
  return options.reduce<SizeOption | undefined>((best, option) => {
    const distance = Math.abs(
      Math.min(option.width, option.height) - shortEdge
    );
    return !best ||
      distance < Math.abs(Math.min(best.width, best.height) - shortEdge)
      ? option
      : best;
  }, undefined);
};
