import useUserSettings from '@/hooks/use-user-settings';
import { Tag, TagProps } from 'antd';
import React from 'react';

const ThemeTag: React.FC<TagProps & { opacity?: number }> = ({
  opacity,
  style,
  children,
  ...restProps
}) => {
  const { userSettings } = useUserSettings();
  const { isDarkTheme } = userSettings;
  return (
    <Tag
      {...restProps}
      style={{
        ...style,
        opacity: isDarkTheme ? 1 : opacity
      }}
    >
      {children}
    </Tag>
  );
};

ThemeTag.displayName = 'ThemeTag';

export default ThemeTag;
