import { getGPUStackPlugin } from '@/plugins';
import { Result } from 'antd';
import React from 'react';

const SettingsPage: React.FC = () => {
  const enterprisePlugin = getGPUStackPlugin();
  const BrandingUI = enterprisePlugin?.components?.BrandingUI;

  if (!BrandingUI) {
    return (
      <Result
        status="404"
        title="404"
        subTitle="Enterprise settings page is unavailable."
      />
    );
  }

  return <BrandingUI />;
};

export default SettingsPage;
