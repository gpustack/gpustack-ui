import { OverlayScroller } from '@/components/overlay-scroller';
import React from 'react';

interface TitleTipProps {
  isOverflowing: boolean;
  showTitle: boolean;
  title: React.ReactNode;
  children: React.ReactNode;
}

const TitleTip: React.FC<TitleTipProps> = (props) => {
  const { isOverflowing, showTitle, title, children } = props;

  return (
    <OverlayScroller maxHeight={200}>
      <div
        style={{
          width: 'fit-content',
          maxWidth: 'var(--width-tooltip-max)'
        }}
      >
        {isOverflowing || showTitle ? title || children : ''}
      </div>
    </OverlayScroller>
  );
};

export default React.memo(TitleTip);
