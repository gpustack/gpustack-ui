// Logic that runs globally and before the application will be executed here

import { getStorageUserSettings } from '@/atoms/settings';
import AppThemeProvider from '@/components/app-theme-provider';
import { ConfigProvider } from 'antd';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// Initialize the CSS variables and static holders before boot-time requests.
document.documentElement.setAttribute(
  'data-theme',
  getStorageUserSettings().theme
);
ConfigProvider.config({
  holderRender: (children) => <AppThemeProvider>{children}</AppThemeProvider>
});

dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
