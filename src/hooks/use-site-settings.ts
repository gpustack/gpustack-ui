import { siteSettingsAtom } from '@/atoms/site-settings';
import { useAtomValue } from 'jotai';

export default function useSiteSettings() {
  return useAtomValue(siteSettingsAtom);
}
