// @ts-nocheck
import avatarImg from '@/assets/images/avatar.png';
import IconFont from '@/components/icon-font';
import externalLinks from '@/constants/external-links';
import {
  DiscordOutlined,
  GithubOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  MoreOutlined,
  ReadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { getAllLocales, history } from '@umijs/max';
import { Avatar, Menu, Spin } from 'antd';
import _ from 'lodash';
import React from 'react';

const getMenuStyle = (
  collapsed: boolean,
  siderWidth: number,
  extraStyle: React.CSSProperties = {}
) => ({
  width: collapsed ? 40 : `calc(${siderWidth}px - 16px)`,
  ...extraStyle
});

export const getRightRenderContent = (opts: {
  runtimeConfig: any;
  loading: boolean;
  initialState: any;
  collapsed: boolean;
  setInitialState: any;
  siderWidth: number;
  intl: any;
}) => {
  const { intl, collapsed, siderWidth, showUpgrade, isDarkTheme } = opts;

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

  const helpList = [
    {
      key: 'site',
      icon: <HomeOutlined />,
      label: 'GPUStack',
      url: externalLinks.site
    },
    {
      key: 'github',
      icon: <GithubOutlined />,
      label: intl.formatMessage({ id: 'common.issue.report' }),
      url: externalLinks.reportIssue
    },
    {
      key: 'faq',
      icon: <IconFont type="icon-fankuifaqs"></IconFont>,
      label: intl.formatMessage({ id: 'common.button.faq' }),
      url: externalLinks.faq
    },
    {
      key: 'Discord',
      icon: <DiscordOutlined />,
      label: 'Discord',
      url: externalLinks.discord
    },
    {
      key: 'docs',
      icon: <ReadOutlined />,
      label: intl.formatMessage({ id: 'common.button.docs' }),
      url: externalLinks.documentation
    },
    {
      key: 'version',
      icon: <InfoCircleOutlined />,
      label: intl.formatMessage({ id: 'common.button.version' })
    }
  ];

  const helpMenu = {
    selectedKeys: [],
    className: collapsed
      ? 'user-menu-container user-menu-collapsed'
      : 'user-menu-container',
    mode: 'vertical',
    expandIcon: false,
    triggerSubMenuAction: 'hover',
    items: [
      {
        key: 'help',
        icon: <IconFont type="icon-help" />,
        label: (
          <span className="sub-title ">
            <span className="flex-center">
              <span>{intl?.formatMessage?.({ id: 'common.button.help' })}</span>
              {showUpgrade && (
                <span
                  className="m-l-5"
                  style={{
                    display: 'flex',
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'var(--ant-orange-5)'
                  }}
                ></span>
              )}
            </span>
          </span>
        ),
        children: helpList.map((item) => ({
          key: item.key,
          label: (
            <span className="flex flex-center">
              {item.icon}
              {item.key === 'version' ? (
                <>
                  <a className="m-l-8">{item.label}</a>
                  {showUpgrade && (
                    <span className="new-icon">
                      <span className="text">
                        {intl.formatMessage({ id: 'common.text.new' })}
                      </span>
                    </span>
                  )}
                </>
              ) : (
                <a
                  className="m-l-8"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.label}
                </a>
              )}
            </span>
          ),
          onClick() {
            if (item.key === 'version') {
              opts.runtimeConfig.showVersion();
            }
            if (item.key === 'shortcuts') {
              opts.runtimeConfig.showShortcuts();
            }
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
    expandIcon: collapsed ? false : <MoreOutlined />,
    // inlineCollapsed: collapsed,
    triggerSubMenuAction: 'hover',
    items: [
      {
        label: '',
        key: 'user',
        className: 'user-avatar',
        icon: (
          <span className="avatar-container">
            <Avatar
              size={28}
              src={opts.initialState?.currentUser?.avatar_url}
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
                style={{
                  fontWeight: 'var(--font-weight-normal)',
                  maxWidth: 100,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {opts.initialState?.currentUser?.username}
              </span>
            )}
          </span>
        ),
        children: [
          {
            key: 'apikeys',
            label: (
              <span className="flex flex-center">
                <IconFont type="icon-key" />
                <span className="m-l-8" style={{ marginLeft: 8 }}>
                  {intl?.formatMessage?.({ id: 'menu.apikeys' })}
                </span>
              </span>
            ),
            onClick: () => {
              history.push('/api-keys');
            }
          },
          {
            key: 'settings',
            label: (
              <span className="flex flex-center">
                <SettingOutlined />
                <span className="m-l-8" style={{ marginLeft: 8 }}>
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
                <span className="m-l-8" style={{ marginLeft: 8 }}>
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
    <>
      <Menu {...helpMenu} mode="vertical" />
      <Menu {...userMenu} mode="vertical" />
    </>
  );
};
