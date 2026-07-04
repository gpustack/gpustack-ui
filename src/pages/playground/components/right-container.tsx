import useWindowResize from '@/hooks/use-window-resize';
import { GSDrawer, useOverlayScroller } from '@gpustack/core-ui';
import { getDrawerWidth } from '@gpustack/core-ui/utils';
import { useIntl } from '@umijs/max';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import s from '../style/params-container.module.less';

const PARAMS_PANEL_WIDTH = 390;

const RightContainer: React.FC<{
  collapsed: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onDismiss?: () => void;
}> = ({ children, footer, collapsed, onDismiss }) => {
  const intl = useIntl();
  const { isMobile, size } = useWindowResize();
  const { initialize } = useOverlayScroller();
  const paramsRef = React.useRef<HTMLDivElement>(null);
  const drawerWidth = getDrawerWidth(size.width, PARAMS_PANEL_WIDTH);

  useEffect(() => {
    if (paramsRef.current && !isMobile) {
      initialize(paramsRef.current);
    }
  }, [initialize, isMobile]);

  if (isMobile) {
    return (
      <GSDrawer
        title={intl.formatMessage({ id: 'playground.parameters' })}
        placement="right"
        open={!collapsed}
        onClose={onDismiss}
        destroyOnHidden={false}
        keyboard
        styles={{
          wrapper: { width: drawerWidth },
          body: { padding: 0, display: 'flex', flexDirection: 'column' }
        }}
        className={s.mobileDrawer}
      >
        <div className={s.mobileBox} ref={paramsRef}>
          {children}
        </div>
        {footer}
      </GSDrawer>
    );
  }

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
