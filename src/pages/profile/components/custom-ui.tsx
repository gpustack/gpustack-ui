import useUserSettings from '@/hooks/use-user-settings';
import { Button, ColorPicker } from 'antd';
import React from 'react';

const CustomUI: React.FC = () => {
  const { setUserSettings, userSettings } = useUserSettings();

  const handleOnChange = (color: any, css: string) => {
    const colorPrimary = color.toHexString();
    if (!colorPrimary) return;
    setUserSettings({
      ...userSettings,
      colorPrimary: color.toHexString()
    });
  };

  return (
    <div>
      <h1>Custom UI Component</h1>
      <Button type="primary">主题色</Button>
      <div>
        <ColorPicker onChange={handleOnChange} format="hex"></ColorPicker>
      </div>
    </div>
  );
};

CustomUI.displayName = 'CustomUI';

export default CustomUI;
