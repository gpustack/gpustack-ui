import { DEFAULT_ENTER_PAGE } from '@/config/settings';
import useWindowResize from '@/hooks/use-window-resize';
import { RouteContext } from '@ant-design/pro-components';
import { useAccess, useNavigate } from '@umijs/max';
import { Drawer } from 'antd';
import classNames from 'classnames';
import type { MouseEvent } from 'react';
import { useContext, useMemo } from 'react';
import { clearMenuData } from './clear-menu-data';
import { LogoIcon } from './Logo';
import { useMobileMenu } from './mobile-menu-context';
import SiderMenu from './sider-menu';

const MobileNavDrawer = () => {
  const { isMobile } = useWindowResize();
  const {
    open,
    setOpen,
    closeWithoutMotion,
    disableCloseMotion,
    resetCloseMotion
  } = useMobileMenu();
  const routeContext = useContext(RouteContext);
  const navigate = useNavigate();
  const access = useAccess();

  const menuData = useMemo(
    () => clearMenuData(routeContext?.menuData || []),
    [routeContext?.menuData]
  );

  const handleMenuHeaderClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const pagepath = access?.canSeeAdmin
      ? DEFAULT_ENTER_PAGE.adminForNormal
      : DEFAULT_ENTER_PAGE.user;
    navigate(pagepath);
    closeWithoutMotion();
  };

  const handleAfterOpenChange = (visible: boolean) => {
    if (!visible) {
      resetCloseMotion();
    }
  };

  if (!isMobile) {
    return null;
  }

  return (
    <Drawer
      placement="left"
      width={280}
      open={open}
      onClose={() => setOpen(false)}
      afterOpenChange={handleAfterOpenChange}
      push={false}
      motion={disableCloseMotion ? false : undefined}
      rootClassName={classNames('mobile-nav-drawer-root', {
        'mobile-nav-drawer-root--instant': disableCloseMotion
      })}
      getContainer={() => document.body}
      styles={{ body: { padding: 0 } }}
      destroyOnClose={false}
      zIndex={1100}
    >
      <div className="mobile-nav-drawer">
        <div className="mobile-nav-drawer-logo" onClick={handleMenuHeaderClick}>
          <LogoIcon />
        </div>
        <SiderMenu
          menuData={menuData as any}
          collapsed={false}
          initialState={{} as Global.InitialStateType}
          onMenuItemClick={closeWithoutMotion}
        />
      </div>
    </Drawer>
  );
};

export default MobileNavDrawer;
