import { resolveSiteSettings } from './index';
import type { SiteSettings } from './types';

/** Return a safe link without relying on the API's input validation. */
export const resolveFooterUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const link = value.trim();
  if (
    !link ||
    /[\\\s]/.test(link) ||
    [...link].some(
      (char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127
    )
  ) {
    return undefined;
  }
  if (link.startsWith('/')) {
    return link.startsWith('//') ? undefined : link;
  }
  if (!/^https?:\/\/[^/?#]/i.test(link)) return undefined;
  try {
    const parsed = new URL(link);
    const authority = link.split('/')[2];
    return parsed.hostname && !authority.includes('@') ? link : undefined;
  } catch {
    return undefined;
  }
};

const nullableFields = [
  'logo',
  'logo_dark',
  'mini_logo',
  'mini_logo_dark',
  'favicon',
  'footer_name',
  'footer_url',
  'updated_at'
] as const;

/** Reject HTML fallbacks and malformed JSON before enabling the editor. */
export const parseSiteSettings = (value: unknown): SiteSettings => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid site settings response');
  }
  const settings = value as Record<string, unknown>;
  if (
    typeof settings.site_name !== 'string' ||
    !settings.site_name.trim() ||
    settings.site_name.length > 128 ||
    typeof settings.primary_color !== 'string' ||
    !/^#[0-9a-fA-F]{6}$/.test(settings.primary_color) ||
    nullableFields.some(
      (field) => settings[field] != null && typeof settings[field] !== 'string'
    )
  ) {
    throw new Error('Invalid site settings response');
  }
  return resolveSiteSettings(settings as Partial<SiteSettings>);
};
