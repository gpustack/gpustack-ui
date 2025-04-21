import useUserSettings from '@/hooks/use-user-settings';
import React from 'react';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import styled from 'styled-components';

const Wrapper = styled.div`
  .simplebar-scrollbar::before {
    width: var(--scrollbar-size);
    background: var(--scrollbar-handle-bg);
  }
  &.dark {
    .simplebar-scrollbar::before {
      width: var(--scrollbar-size);
      background: var(--scrollbar-handle-light-bg);
    }
  }
`;

interface SimpleOverlayProps {
  height?: string | number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const SimpleOverlay: React.FC<SimpleOverlayProps> = ({
  height,
  children,
  style
}) => {
  const { isDarkTheme } = useUserSettings();
  return (
    <Wrapper className={isDarkTheme ? 'dark' : 'light'}>
      <SimpleBar
        style={{
          height: height,
          ...style
        }}
      >
        {children}
      </SimpleBar>
    </Wrapper>
  );
};

export default SimpleOverlay;
