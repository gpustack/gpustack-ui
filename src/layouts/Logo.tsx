// @ts-nocheck
import { useLogo } from '@/hooks/use-logo';
import React from 'react';

const LogoIcon: React.FC = () => {
  const { sidebarLogo } = useLogo();

  return <img src={sidebarLogo} alt="logo" style={{ height: 24 }} />;
};

const SLogoIcon: React.FC = () => {
  const { miniLogo } = useLogo();

  return <img src={miniLogo} alt="logo" style={{ height: 24 }} />;
};

export { LogoIcon, SLogoIcon };
