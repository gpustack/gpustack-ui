// @ts-nocheck

import avatarImg from '@/assets/images/avatar.png';
import langConfigMap from '@/locales/lang-config-map';
import {
  GlobalOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { getAllLocales, history, setLocale } from '@umijs/max';
import { Avatar, Menu, Spin } from 'antd';
import _ from 'lodash';

export function getRightRenderContent(opts: {
  runtimeConfig: any;
  loading: boolean;
  initialState: any;
  collapsed: boolean;
  setInitialState: any;
  siderWidth: number;
  intl: any;
}) {
  const { intl, collapsed, siderWidth } = opts;
  const allLocals = getAllLocales();
  if (opts.runtimeConfig.rightRender) {
    return opts.runtimeConfig.rightRender(
      opts.initialState,
      opts.setInitialState,
      opts.runtimeConfig
    );
  }

  const showAvatar =
    opts.initialState?.currentUser?.avatar ||
    opts.initialState?.currentUser?.username ||
    opts.runtimeConfig.logout;
  const disableAvatarImg = opts.initialState?.currentUser?.avatar === false;
  const nameClassName = disableAvatarImg
    ? 'umi-plugin-layout-name umi-plugin-layout-hide-avatar-img'
    : 'umi-plugin-layout-name';
  const avatar = showAvatar ? (
    <span className="umi-plugin-layout-action">
      {!disableAvatarImg ? (
        <Avatar
          size="small"
          className="umi-plugin-layout-avatar"
          src={opts.initialState?.currentUser?.avatar || avatarImg}
          alt="avatar"
        />
      ) : null}
      <span className={nameClassName}>
        {opts.initialState?.currentUser?.username}
      </span>
    </span>
  ) : null;

  if (opts.loading) {
    return (
      <div className="umi-plugin-layout-right">
        <Spin size="small" style={{ marginLeft: 8, marginRight: 8 }} />
      </div>
    );
  }

  const langMenu = {
    selectedKeys: [],
    className: collapsed
      ? 'user-menu-container user-menu-collapsed'
      : 'user-menu-container',
    mode: 'vertical',
    expandIcon: false,
    inlineCollapsed: collapsed,
    triggerSubMenuAction: 'hover',
    items: [
      {
        key: 'lang',
        icon: <GlobalOutlined />,
        label: (
          <span>
            {intl?.formatMessage?.({ id: 'common.settings.language' })}
          </span>
        ),
        children: allLocals.map((key) => ({
          key,
          label: (
            <span className="flex flex-center">
              <span>{_.get(langConfigMap, [key, 'icon'])}</span>
              <span className="m-l-8">
                {_.get(langConfigMap, [key, 'label'])}
              </span>
            </span>
          ),
          onClick: () => {
            setLocale(key, false);
          }
        }))
      }
    ]
  };

  const userMenu = {
    selectedKeys: [],
    className: collapsed
      ? 'user-menu-container user-menu-collapsed'
      : 'user-menu-container',
    mode: 'vertical',
    expandIcon: false,
    inlineCollapsed: collapsed,
    triggerSubMenuAction: 'hover',
    items: [
      {
        label: '',
        key: 'user',
        className: 'user-avatar',
        icon: (
          <span>
            <Avatar
              size={28}
              style={{
                color: 'var(--ant-color-text)',
                fontSize: 16
              }}
            >
              {_.toUpper(opts.initialState?.currentUser?.username?.charAt(0))}
            </Avatar>
            {!collapsed && (
              <span
                className="m-l-8 font-size-14"
                style={{ fontWeight: 'var(--font-weight-normal)' }}
              >
                {opts.initialState?.currentUser?.username}
              </span>
            )}
          </span>
        ),
        children: [
          {
            key: 'settings',
            label: (
              <span className="flex flex-center">
                <SettingOutlined />
                <span>
                  {intl?.formatMessage?.({ id: 'common.button.settings' })}
                </span>
              </span>
            ),
            onClick: () => {
              history.push('/profile');
            }
          },
          {
            key: 'logout',
            label: (
              <span className="flex flex-center">
                <LogoutOutlined />
                <span>
                  {intl?.formatMessage?.({ id: 'common.button.logout' })}
                </span>
              </span>
            ),
            onClick: () => {
              opts?.runtimeConfig?.logout?.(opts.initialState.currentUser);
            }
          }
        ]
      }
    ]
  };

  return (
    <div>
      <Menu
        {...langMenu}
        style={{
          width: collapsed ? 64 : `calc(${siderWidth}px - 16px)`
        }}
      ></Menu>
      <Menu
        {...userMenu}
        style={{
          width: collapsed ? 64 : `calc(${siderWidth}px - 16px)`,
          marginTop: 20
        }}
      ></Menu>
    </div>
  );
}
