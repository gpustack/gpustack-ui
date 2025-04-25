import { colorPrimary } from '@/config/theme';
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

  const handleReset = () => {
    setUserSettings({
      ...userSettings,
      colorPrimary: colorPrimary
    });
  };

  return (
    <div>
      <h1>Custom UI Component</h1>
      <Button type="primary">Brand Color</Button>
      <div className="flex-center gap-16 m-t-16">
        <ColorPicker onChange={handleOnChange} format="hex"></ColorPicker>
        <Button type="primary" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </div>
  );
};

CustomUI.displayName = 'CustomUI';

export default CustomUI;
