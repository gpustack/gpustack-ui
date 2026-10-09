import { userSettingsHelperAtom } from '@/atoms/settings';
import getThemeConfig from '@/config/theme/get-theme-config';
import { ConfigProvider } from 'antd';
import { useAtomValue } from 'jotai';
import type { PropsWithChildren } from 'react';

// Static antd APIs render in a separate React root. Read the same atom as the
// page so open messages also update when the theme or brand color changes.
export default function AppThemeProvider({ children }: PropsWithChildren) {
  const settings = useAtomValue(userSettingsHelperAtom);

  return (
    <ConfigProvider theme={getThemeConfig(settings)}>{children}</ConfigProvider>
  );
}
