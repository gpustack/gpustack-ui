import { useOverlayScroller } from '@gpustack/core-ui';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import s from '../style/params-container.module.less';

const RightContainer: React.FC<{
  collapsed: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ children, footer, collapsed }) => {
  const { initialize } = useOverlayScroller();
  const paramsRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paramsRef.current) {
      initialize(paramsRef.current);
    }
  }, [initialize]);

  return (
    <div className={classNames(s.wrapper, { [s.collapsed]: collapsed })}>
      <div className={s.box} ref={paramsRef}>
        {children}
      </div>
      {footer}
    </div>
  );
};

export default RightContainer;
