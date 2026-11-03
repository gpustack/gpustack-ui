import GpustackLogo from '@/assets/images/gpustack-logo.png';
import { useLogo } from '@/hooks/use-logo';
import React from 'react';

const LogoIcon: React.FC = () => {
  const { sidebarLogo, siteName } = useLogo();

  return (
    <img
      src={sidebarLogo}
      alt={siteName}
      className={
        sidebarLogo === GpustackLogo
          ? 'sider-brand-logo sider-brand-logo-padded'
          : 'sider-brand-logo'
      }
    />
  );
};

const SLogoIcon: React.FC = () => {
  const { miniLogo, siteName } = useLogo();

  return <img src={miniLogo} alt={siteName} className="sider-brand-logo" />;
};

export { LogoIcon, SLogoIcon };
