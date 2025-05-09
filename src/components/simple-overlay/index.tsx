import useUserSettings from '@/hooks/use-user-settings';
import React, { useEffect } from 'react';
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
  onScrollEnd?: (e: React.UIEvent<HTMLDivElement>) => void;
  disableTrigger?: boolean;
}

const SimpleOverlay: React.FC<SimpleOverlayProps> = ({
  height,
  children,
  style,
  disableTrigger,
  onScrollEnd
}) => {
  const { isDarkTheme } = useUserSettings();
  const simpleBarRef = React.useRef<any>(null);

  useEffect(() => {
    // simpleBarRef.current.recalculate();

    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const scrollElement = simpleBarRef.current?.getScrollElement();
      const scrollHeight = scrollElement.scrollHeight;
      const clientHeight = scrollElement.clientHeight;
      const scrollTop = scrollElement.scrollTop;

      // Check if the scrollbar is at the bottom 20px for buffer
      const isAtBottom = scrollHeight - clientHeight - scrollTop <= 20;
      if (isAtBottom && !disableTrigger) {
        onScrollEnd?.(e);
      }
    };
    simpleBarRef.current
      ?.getScrollElement()
      .addEventListener('scroll', onScroll);

    return () => {
      simpleBarRef.current
        ?.getScrollElement()
        .removeEventListener('scroll', onScroll);
    };
  }, [height, disableTrigger, onScrollEnd]);
  return (
    <Wrapper className={isDarkTheme ? 'dark' : 'light'}>
      <SimpleBar
        ref={simpleBarRef}
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
