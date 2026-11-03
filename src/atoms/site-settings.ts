import { defaultSiteSettings } from '@/pages/site-settings/config';
import type { SiteSettings } from '@/pages/site-settings/config/types';
import { atom } from 'jotai';

export const siteSettingsAtom = atom<SiteSettings>(defaultSiteSettings);
