// @ts-nocheck

import avatarImg from '@/assets/images/avatar.png';
import {
  GlobalOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { SelectLang, history } from '@umijs/max';
import { Avatar, Dropdown, Menu, Spin, version } from 'antd';

export function getRightRenderContent(opts: {
  runtimeConfig: any;
  loading: boolean;
  initialState: any;
  setInitialState: any;
}) {
  console.log('runtimeConfig==', opts.runtimeConfig, opts);
  // const intl = useIntl();
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

  const renderExtraActions = () => {
    return (
      <SelectLang
        style={{ padding: '10px 18px', marginBottom: '20px' }}
        reload={false}
        icon={
          <span style={{ fontSize: '12px' }}>
            <GlobalOutlined />
            <span className="m-l-8">
              {/* {FormattedMessage({ id: 'common.settings.language' })} */}
              Language
            </span>
          </span>
        }
      ></SelectLang>
    );
  };

  // 如果没有打开Locale，并且头像为空就取消掉这个返回的内容
  if (!avatar) return null;

  const langMenu = {
    className: 'umi-plugin-layout-menu',
    selectedKeys: [],
    items: [
      {
        key: 'settings',
        label: (
          <>
            <SettingOutlined />
            {/* {intl.formatMessage({ id: 'common.button.settings' })} */}
            Settings
          </>
        ),
        onClick: () => {
          history.push('/profile');
        }
      },
      // {
      //   key: 'theme',
      //   label: (
      //     <>
      //       <SunOutlined />
      //       外观
      //     </>
      //   ),
      //   onClick: () => {
      //     console.log('theme');
      //   }
      // },
      {
        key: 'logout',
        label: (
          <>
            <LogoutOutlined />
            {/* {intl.formatMessage({ id: 'common.button.logout' })} */}
            Logout
          </>
        ),
        onClick: () => {
          opts?.runtimeConfig?.logout?.(opts.initialState.currentUser);
        }
      }
    ]
  };
  // antd@5 和  4.24 之后推荐使用 menu，性能更好

  let dropdownProps;
  if (version.startsWith('5.') || version.startsWith('4.24.')) {
    dropdownProps = { menu: langMenu };
  } else if (version.startsWith('3.')) {
    dropdownProps = {
      overlay: (
        <Menu>
          {langMenu.items.map((item) => (
            <Menu.Item key={item.key} onClick={item.onClick}>
              {item.label}
            </Menu.Item>
          ))}
        </Menu>
      )
    };
  } else {
    // 需要 antd 4.20.0 以上版本
    dropdownProps = { overlay: <Menu {...langMenu} /> };
  }

  return (
    <div style={{ width: '100%' }}>
      {renderExtraActions()}
      <div className="umi-plugin-layout-right anticon">
        {opts.runtimeConfig.logout ? (
          <>
            <Dropdown
              {...dropdownProps}
              overlayClassName="umi-plugin-layout-container"
            >
              {avatar}
            </Dropdown>
            <span></span>
          </>
        ) : (
          avatar
        )}
      </div>
    </div>
  );
}
