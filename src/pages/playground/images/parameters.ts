import { generateRandomNumber } from '@/utils';
import _ from 'lodash';
import { SizeOption } from '../config/params-config';

export const normalizeImageParameters = (parameters: Record<string, any>) => ({
  ..._.omit(parameters, ['width', 'height', 'preview', 'random_seed']),
  size:
    parameters.size === 'custom'
      ? parameters.width && parameters.height
        ? `${parameters.width}x${parameters.height}`
        : ''
      : parameters.size
});

export const buildImageParameters = (
  parameters: Record<string, any>,
  prompt: string
) => ({
  ..._.omitBy(
    normalizeImageParameters(parameters),
    (value: unknown) => value === undefined || value === null || value === ''
  ),
  seed: parameters.random_seed
    ? generateRandomNumber()
    : (parameters.seed ?? null),
  stream: false,
  prompt
});

export const getImageParameterErrors = (
  parameters: Record<string, any>,
  meta: Record<string, any>,
  sizes: SizeOption[]
): string[] => {
  const fields: string[] = [];
  if (!Number.isInteger(parameters.n) || parameters.n < 1 || parameters.n > 4) {
    fields.push('n');
  }
  if (parameters.size === 'custom') {
    for (const field of ['width', 'height']) {
      const max =
        meta[`max_${field}`] || Math.max(1024, meta[`default_${field}`] || 0);
      if (
        !Number.isInteger(parameters[field]) ||
        parameters[field] < 256 ||
        parameters[field] > max
      ) {
        fields.push(field);
      }
    }
  } else {
    const [width, height] = String(parameters.size).split('x').map(Number);
    if (
      !sizes.some(({ value }) => value === parameters.size) ||
      (meta.max_width && width > meta.max_width) ||
      (meta.max_height && height > meta.max_height)
    )
      fields.push('size');
  }
  if (
    !parameters.random_seed &&
    parameters.seed != null &&
    !Number.isInteger(parameters.seed)
  ) {
    fields.push('seed');
  }
  return fields;
};
