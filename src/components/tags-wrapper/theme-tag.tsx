import useUserSettings from '@/hooks/use-user-settings';
import { Tag, TagProps } from 'antd';
import React from 'react';
import styled from 'styled-components';

const TagWrapper = styled(Tag)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  height: 22px;
  opacity: 0.7;
  margin: 0;
`;

const ThemeTag: React.FC<TagProps & { opacity?: number }> = ({
  opacity,
  style,
  children,
  ...restProps
}) => {
  const { userSettings } = useUserSettings();
  const { isDarkTheme } = userSettings;
  return (
    <TagWrapper
      {...restProps}
      variant="outlined"
      style={{
        ...style,
        opacity: isDarkTheme ? 1 : opacity
      }}
    >
      {children}
    </TagWrapper>
  );
};

ThemeTag.displayName = 'ThemeTag';

export default ThemeTag;
