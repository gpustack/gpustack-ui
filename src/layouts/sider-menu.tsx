import { collapsedMenuGroupsAtom } from '@/atoms/settings';
import { CaretDownOutlined } from '@ant-design/icons';
import { IconFont, OverlayScroller } from '@gpustack/core-ui';
import { Link, useLocation } from '@umijs/max';
import { Tooltip } from 'antd';
import { createStyles, type FullToken } from 'antd-style';
import { useAtom } from 'jotai';
import React, { useMemo } from 'react';

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
  initialState: Global.InitialStateType;
}

const useStyles = createStyles(
  ({ css, token }: { css: any; token: FullToken }) => {
    // @ts-ignore
    const { Menu } = token;

    // Hover feedback only. Nothing about collapsing or expanding the sider is
    // animated from here — the rail's own width transition is the whole effect.
    const motion = `${token.motionDurationMid} ${token.motionEaseInOut}`;

    return {
      siderMenu: css`
        width: 100%;
        &.sider-menu-collapsed {
          .menu-item-title {
            /* Fades out, but has to finish well inside the rail's own 200ms.
               The row clips at overflow:hidden and the clip edge sweeps from
               204px back to 48px, so any label still visible when that edge
               reaches it gets progressively shortened — the "tail". Half the
               rail duration, front-loaded by ease-out (~85% of the drop is
               spent in the first two thirds), leaves the label all but gone
               before the edge arrives.
               opacity rather than display/visibility because the row still has
               to keep its box: the collapsed row clips at x=48 while the label
               starts at x=44, so ~4px of the first glyph would otherwise show
               in the resting collapsed state. */
            opacity: 0;
            transition: opacity ${token.motionDurationFast}
              ${token.motionEaseOut};
          }
        }
        .os-scrollbar-vertical .os-scrollbar-handle {
          min-width: 4px;
          max-width: 4px;
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
        /* Deliberately NOT transitioned. Each group title grows ~41px on
           expand, which pushes every row below it down — rows near the bottom
           travel much further than rows near the top, so animating it shears
           the whole list into a parallelogram and fights the horizontal
           reveal. Snapping the vertical layout in one frame leaves the rail's
           width as the only thing in motion. */
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
          color: var(--ant-color-text);
          font-weight: 400;
        }

        &.menu-item-group-title-collapsed {
          position: relative;
          height: 1px;
          padding-block: 0;
          padding-inline: 0;
          justify-content: center;

          .group-title-text {
            /* overflow:hidden clips to the padding box, so this 1px row still
               paints a 1px band through the middle of the label. Hide it
               outright. No transition, same as the item labels. */
            opacity: 0;
          }
        }
      `,
      menuItemContent: css`
        margin: 2px 0;
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
        /* Collapsed, the usable rail is 48px wide and this row's content box
           is exactly the icon's 16px — so the icon is already centered at
           this padding. Never re-center it for the collapsed state: the class
           lands before the sider has finished animating its width, so
           centering would fling the icon right and slide it back. */
        padding-inline: 16px var(--ant-padding);
        overflow: hidden;
        white-space: nowrap;
        height: ${Menu.itemHeight}px;
        line-height: ${Menu.itemHeight}px;
        color: var(--ant-color-text-tertiary);
        transition:
          color ${motion},
          background-color ${motion};
        &:hover {
          background-color: ${Menu.itemHoverBg};
          color: ${Menu.itemHoverColor};
        }
        &.menu-item-selected {
          background-color: ${Menu.menuItemSelectedBg};
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
          /* The collapsed rail clips this row down to the icon's own width;
             without this flexbox squeezes the icon and it drifts as the
             width animates. */
          flex-shrink: 0;
        }
        .menu-item-title {
          /* Deliberately no transition declared here, so expanding restores the
             label in one frame and the widening rail wipes it into view. Fading
             it in as well would be a second reveal mechanism racing the first.
             This also leaves nothing for the collapsed rule to inherit — that
             rule states its own fade in full, so the two directions can be
             retimed independently. */
          opacity: 1;
        }
      `,
      menuItemGroup: css`
        &.menu-item-group-hidden {
          display: none;
        }
      `,
      line: css`
        height: 1px;
        margin-block: 6px;
        background-color: ${token.colorSplit};
        position: absolute;
        left: -2px;
        right: -2px;
      `
    };
  }
);

const SiderMenu: React.FC<SiderMenuProps> = (props) => {
  const { menuData, collapsed } = props;
  const { styles, cx } = useStyles();
  const location = useLocation();
  const [storedCollapsedGroups, setCollapsedGroups] = useAtom(
    collapsedMenuGroupsAtom
  );
  // atomWithStorage falls back to the initial value on JSON parse
  // errors, but not when the stored value is valid JSON of another
  // shape — normalize so array methods below can't throw.
  const collapsedGroups = Array.isArray(storedCollapsedGroups)
    ? storedCollapsedGroups
    : [];
  const collapseKeys = useMemo(
    () => new Set(collapsedGroups),
    [collapsedGroups]
  );

  const handleToggleGroup = (e: any, menuGroup: any) => {
    e.stopPropagation();

    setCollapsedGroups(
      collapsedGroups.includes(menuGroup.key)
        ? collapsedGroups.filter((key) => key !== menuGroup.key)
        : [...collapsedGroups, menuGroup.key]
    );
  };

  const menuItemRender = (menuItem: MenuItem, key: string) => {
    const selected =
      location.pathname === menuItem.path ||
      menuItem.subMenu?.includes(location.pathname);

    // Keep this subtree identical in both states — the icon and the label
    // always render, and only their styles change. Branching the DOM on
    // `collapsed` would remount every row on each toggle, and would remount
    // the Link on a different parent depending on whether Tooltip wraps it.
    return (
      <div
        className={cx(styles.menuItemContent, 'menu-item-content')}
        key={key}
      >
        <Tooltip title={collapsed ? menuItem.name : ''} placement="right">
          <Link
            prefetch="intent"
            to={menuItem.path.replace('/*', '')}
            target={menuItem.target}
            className={cx(styles.menuItemWrapper, 'menu-item', {
              'menu-item-selected': selected
            })}
          >
            <IconFont
              type={
                selected
                  ? menuItem.selectedIcon || ''
                  : menuItem.defaultIcon || ''
              }
            ></IconFont>
            <span className="menu-item-title">{menuItem.name}</span>
          </Link>
        </Tooltip>
      </div>
    );
  };

  return (
    <div
      className={cx(styles.siderMenu, 'sider-menu', {
        'sider-menu-collapsed': collapsed
      })}
    >
      <OverlayScroller
        styles={{
          wrapper: {
            paddingInline: 0,
            maxHeight: '100%'
          }
        }}
      >
        <div style={{ paddingRight: 8 }}>
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
                    {/* Mounted in both states and hidden by style, so toggling
                        the sider doesn't remount every group header. The
                        collapsed row is 1px tall, which is why the styles hide
                        this outright rather than relying on the clip. */}
                    <span className="group-title-text">
                      <span>{item.name}</span>
                      <CaretDownOutlined
                        rotate={collapseKeys.has(item.key) ? -90 : 0}
                      ></CaretDownOutlined>
                    </span>
                    {collapsed && <span className={styles.line}></span>}
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
      </OverlayScroller>
    </div>
  );
};

export default SiderMenu;
