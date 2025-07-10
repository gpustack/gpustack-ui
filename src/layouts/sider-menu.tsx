import IconFont from '@/components/icon-font';
import { CaretDownOutlined } from '@ant-design/icons';
import { Link, useLocation } from '@umijs/max';
import { Divider, Tooltip } from 'antd';
import { createStyles } from 'antd-style';
import React, { useMemo, useState } from 'react';

interface MenuItem {
  icon?: string;
  selectedIcon?: string;
  defaultIcon?: string;
  children?: MenuItem[];

  [key: string]: any;
}

interface SiderMenuProps {
  menuData: MenuItem[];
  collapsed?: boolean;
}

const useStyles = createStyles(({ css, token }) => {
  console.log('useStyles', token);

  // @ts-ignore
  const { Menu } = token;

  return {
    siderMenu: css`
      &.sider-menu-collapsed {
        .menu-item {
          justify-content: center;
          padding: 0;
        }
      }
    `,
    groupTitle: css`
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      white-space: nowrap;
      padding: var(--ant-padding-xs) var(--ant-padding);
      font-size: 12px;
      padding-bottom: 4px;
      overflow: hidden;
      height: 30px;
      &:hover {
        .group-title-text {
          color: var(--ant-color-text);
        }
      }
      .anticon {
        transform: scale(0.8);
      }
      .group-title-text {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--ant-color-text-tertiary);
        font-weight: 400;
      }

      &.menu-item-group-title-collapsed {
        height: 1px;
        padding-block: 0;
        padding-inline: 0;
      }
    `,
    menuItemContent: css`
      margin: 4px;
      border-radius: 4px;
      overflow: hidden;
    `,
    menuItemWrapper: css`
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 12px;
      cursor: pointer;
      position: relative;
      padding-inline: calc(var(--ant-font-size) * 2) var(--ant-padding);
      padding-left: 16px;
      overflow: hidden;
      white-space: nowrap;
      height: ${Menu.itemHeight}px;
      line-height: ${Menu.itemHeight}px;
      color: var(--ant-color-text-secondary);
      &:hover {
        background-color: ${Menu.itemHoverBg};
        color: ${Menu.itemHoverColor};
      }
      &.menu-item-selected {
        background-color: ${Menu.itemSelectedBg};
        color: ${Menu.itemSelectedColor};
        .anticon {
          color: ${Menu.itemSelectedColor};
        }
      }
      &:active {
        background-color: ${Menu.itemActiveBg};
        color: ${Menu.itemActiveColor};
      }
      .anticon {
        font-size: 16px;
      }
      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
      }
    `,
    menuItemGroup: css`
      &.menu-item-group-hidden {
        display: none;
      }
    `
  };
});

const SiderMenu: React.FC<SiderMenuProps> = (props) => {
  const { menuData, collapsed } = props;
  const { styles, cx } = useStyles();
  const location = useLocation();
  const [collapseKeys, setCollapseKeys] = useState<Set<string>>(new Set());
  console.log('SiderMenu', props);

  const dividerStyles = useMemo(() => {
    if (collapsed) {
      return {
        margin: '6px 0'
      };
    }
    return {
      margin: '6px 16px',
      width: 'unset',
      minWidth: 'unset',
      maxWidth: 'unset'
    };
  }, [collapsed]);

  const handleToggleGroup = (e: any, menuGroup: any) => {
    e.stopPropagation();

    console.log('handleToggleGroup', menuGroup.key);

    if (collapseKeys.has(menuGroup.key)) {
      collapseKeys.delete(menuGroup.key);
    } else {
      collapseKeys.add(menuGroup.key);
    }
    setCollapseKeys(new Set(collapseKeys));
  };

  const menuItemRender = (menuItem: MenuItem, key: string) => {
    return (
      <div
        className={cx(styles.menuItemContent, 'menu-item-content')}
        key={key}
      >
        <Link
          to={menuItem.path.replace('/*', '')}
          target={menuItem.target}
          className={cx(styles.menuItemWrapper, 'menu-item', {
            'menu-item-selected': location.pathname === menuItem.path
          })}
        >
          {collapsed ? (
            <Tooltip title={menuItem.name} placement="right">
              <span className="icon-wrapper">
                <IconFont
                  type={
                    location.pathname === menuItem.path
                      ? menuItem.selectedIcon || ''
                      : menuItem.defaultIcon || ''
                  }
                ></IconFont>
              </span>
            </Tooltip>
          ) : (
            <>
              <IconFont
                type={
                  location.pathname === menuItem.path
                    ? menuItem.selectedIcon || ''
                    : menuItem.defaultIcon || ''
                }
              ></IconFont>
              <span>{menuItem.name}</span>
            </>
          )}
        </Link>
      </div>
    );
  };

  return (
    <div
      className={cx(styles.siderMenu, 'sider-menu', {
        'sider-menu-collapsed': collapsed
      })}
    >
      {menuData.map((item: MenuItem, index: number) => (
        <div key={item.key}>
          {item.children && item.children.length > 0 ? (
            <>
              <div
                className={cx(styles.groupTitle, {
                  'menu-item-group-title-collapsed': collapsed
                })}
                onClick={(e) => handleToggleGroup(e, item)}
              >
                {!collapsed ? (
                  <span className="group-title-text">
                    <span>{item.name}</span>
                    <CaretDownOutlined
                      rotate={collapseKeys.has(item.key) ? -90 : 0}
                    ></CaretDownOutlined>
                  </span>
                ) : (
                  <Divider style={dividerStyles} />
                )}
              </div>
              <div
                className={cx(styles.menuItemGroup, {
                  'menu-item-group-collapsed': collapsed,
                  'menu-item-group-hidden':
                    !collapsed && collapseKeys.has(item.key)
                })}
              >
                {item.children?.map((child: MenuItem) =>
                  menuItemRender(child, child.key)
                )}
              </div>
            </>
          ) : (
            menuItemRender(item, item.key)
          )}
        </div>
      ))}
    </div>
  );
};

export default SiderMenu;
