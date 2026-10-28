import DefaultLogo from '@/assets/images/gpustack-logo.png';
import LangSelect from '@/components/lang-select';
import ThemeDropActions from '@/components/theme-toggle/theme-drop-actions';
import useUserSettings from '@/hooks/use-user-settings';
import Background from '@/pages/login/components/background';
import { IconFont } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { Button, Dropdown, Flex, Tooltip, theme } from 'antd';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  account?: string;
  logoUrl?: string;
  backgroundUrl?: string;
  logoutLabel?: string;
  onLogout: () => void;
}

/** Standalone application shell for authenticated setup and recovery screens. */
export default function AccessLayout({
  children,
  account,
  logoUrl,
  backgroundUrl,
  logoutLabel,
  onLogout
}: Props) {
  const { token } = theme.useToken();
  const intl = useIntl();
  const { isDarkTheme } = useUserSettings();
  const exitLabel =
    logoutLabel || intl.formatMessage({ id: 'common.button.logout' });
  return (
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        minHeight: '100vh',
        color: token.colorText
      }}
    >
      <Background isDarkTheme={isDarkTheme} />
      {backgroundUrl && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: -1,
            opacity: 0.6,
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      )}
      <Flex
        align="center"
        gap={8}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: 60,
          padding: 20,
          zIndex: 10
        }}
      >
        <ThemeDropActions />
        <LangSelect />
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              ...(account
                ? [
                    { key: 'account', label: account, disabled: true },
                    { type: 'divider' as const }
                  ]
                : []),
              {
                key: 'logout',
                label: exitLabel,
                icon: <IconFont type="icon-logout" />,
                onClick: onLogout
              }
            ]
          }}
        >
          <Tooltip title={account || exitLabel}>
            <Button
              type="text"
              size="small"
              aria-label={account || exitLabel}
              style={{
                width: 28,
                height: 28,
                padding: 0,
                color: token.colorTextSecondary
              }}
              icon={
                <IconFont type="icon-user-filled" className="font-size-20" />
              }
            />
          </Tooltip>
        </Dropdown>
      </Flex>
      <Flex
        align="center"
        justify="center"
        style={{ minHeight: '100vh', padding: '88px 24px 48px' }}
      >
        <div
          style={{
            width: 480,
            maxWidth: '100%',
            padding: 40,
            boxSizing: 'border-box',
            borderRadius: `var(--border-radius-modal, ${token.borderRadiusLG}px)`,
            background: `var(--color-modal-content-bg, ${token.colorBgElevated})`,
            boxShadow: `var(--color-modal-box-shadow, ${token.boxShadowSecondary})`
          }}
        >
          <Flex justify="center" style={{ marginBottom: 32 }}>
            <img
              src={logoUrl || DefaultLogo}
              alt="GPUStack"
              style={{ height: 36, maxWidth: '100%', objectFit: 'contain' }}
            />
          </Flex>
          {children}
        </div>
      </Flex>
    </div>
  );
}
