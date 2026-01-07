import { GPUStackVersionAtom, UpdateCheckAtom } from '@/atoms/user';
import DropDownActions from '@/components/drop-down-actions';
import IconFont from '@/components/icon-font';
import VersionInfo, { modalConfig } from '@/components/version-info';
import externalLinks from '@/constants/external-links';
import useBodyScroll from '@/hooks/use-body-scroll';
import { logout } from '@/pages/login/apis';
import { useModel } from '@@/plugin-model';
import {
  DiscordOutlined,
  GithubOutlined,
  HomeOutlined,
  ReadOutlined
} from '@ant-design/icons';
import { history, useIntl, useNavigate } from '@umijs/max';
import { Avatar, Button, Divider, Modal } from 'antd';
import { useAtom } from 'jotai';
import { useMemo } from 'react';
import styled from 'styled-components';
import { DEFAULT_ENTER_PAGE } from '../config/settings';

const UpdateDot = styled.span`
  margin-left: 5px;
  display: flex;
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: var(--ant-orange-5);
`;

const NewLabel = styled.span`
  position: relative;
  top: -4px;
  right: 4px;
  padding: 2px 4px;
  display: flex;
  color: #fff;
  height: 15px;
  justify-content: center;
  align-items: center;
  background-color: var(--ant-orange-5);
  border-radius: 6px 6px 6px 0;
  transform: scale(0.9);

  .text {
    transform: scale(0.8);
    line-height: 1em;
  }
`;

const IconWrapper = styled.span`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ant-color-text-secondary);
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  height: 40px;
`;
const DropdownWrapper = styled.div`
  min-width: 160px;
  box-shadow: var(--ant-box-shadow-secondary);
  background-color: var(--ant-color-bg-elevated);
  border-radius: var(--ant-border-radius-lg);
  padding: var(--ant-padding-xs);
  .ant-dropdown-menu {
    padding: 0;
    box-shadow: none;
    background-color: transparent;
    border-radius: 0;
    a {
      color: var(--ant-color-text);
    }
  }
`;

const CustomItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  justify-content: flex-start;
  height: 32px;
  padding: 0 var(--ant-padding-xs);
  cursor: pointer;
  &.user-info {
    cursor: default;
    justify-content: space-between;
    .user-name {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      max-width: 100px;
    }
  }
  &:not(.user-info):hover {
    background-color: var(--ant-control-item-bg-hover);
  }
  background-color: var(--ant-color-bg-elevated);
`;

export const ExtraContent = (props: { isDarkTheme?: boolean }) => {
  const { isDarkTheme } = props;
  const { saveScrollHeight, restoreScrollHeight } = useBodyScroll();
  const [modal, contextHolder] = Modal.useModal();
  const [version] = useAtom(GPUStackVersionAtom);
  const [updateCheck] = useAtom(UpdateCheckAtom);
  const intl = useIntl();
  const initialInfo = useModel('@@initialState') || {
    initialState: undefined,
    loading: false,
    setInitialState: null
  };

  const { initialState } = initialInfo;

  const navigate = useNavigate();

  const loginPath = DEFAULT_ENTER_PAGE.login;

  // only admin can see upgrade info, and current version is a prod version(exclude dev/rc)
  const showUpgrade = useMemo(() => {
    return (
      initialState?.currentUser?.is_admin &&
      updateCheck.latest_version &&
      updateCheck.latest_version !== version?.version &&
      version?.isProd
    );
  }, [
    updateCheck.latest_version,
    version.version,
    version.isProd,
    initialState?.currentUser?.is_admin
  ]);

  const avatarStyle = useMemo(() => {
    if (isDarkTheme) {
      return {
        color: 'var(--ant-color-text)',
        border: 'none'
      };
    }
    return {};
  }, [isDarkTheme]);

  const showVersion = () => {
    saveScrollHeight();
    modal.info({
      ...modalConfig,
      width: 460,
      content: <VersionInfo intl={intl} />,
      onCancel: restoreScrollHeight
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate(loginPath);
  };

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
    }
  ];

  const helpMenu = {
    items: helpList.map((item) => ({
      key: item.key,
      label: (
        <a
          className="flex flex-center gap-8"
          href={item.url}
          target="_blank"
          rel="noreferrer"
        >
          {item.icon}
          {item.label}
        </a>
      )
    }))
  };

  const userMenu = {
    items: [
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
            <IconFont type="icon-settings-02" />
            <span className="m-l-8" style={{ marginLeft: 8 }}>
              {intl?.formatMessage?.({ id: 'common.button.settings' })}
            </span>
          </span>
        ),
        onClick: () => {
          history.push('/profile');
        }
      }
    ]
  };

  const userPopupRender = (originNode: React.ReactNode) => {
    return (
      <DropdownWrapper>
        <CustomItem className="user-info border-bottom">
          <span className="flex-center gap-8">
            <Avatar
              size={24}
              style={{ ...avatarStyle }}
              src={initialState?.currentUser?.avatar_url}
              icon={
                <IconFont type="icon-user-filled" className="font-size-24" />
              }
            />
            <span className="user-name">
              {initialState?.currentUser?.username}
            </span>
          </span>
        </CustomItem>
        <Divider style={{ marginBlock: 4 }} />
        {originNode}
        <Divider style={{ marginBlock: 4 }} />
        <CustomItem onClick={handleLogout} className="border-top">
          <IconFont type="icon-logout" style={{ fontSize: 17 }} />
          <span>{intl?.formatMessage?.({ id: 'common.button.logout' })}</span>
        </CustomItem>
      </DropdownWrapper>
    );
  };

  const helpPopupRender = (originNode: React.ReactNode) => {
    return <DropdownWrapper>{originNode}</DropdownWrapper>;
  };

  return (
    <Wrapper>
      {contextHolder}
      <div
        style={{
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Button
          type="text"
          size="small"
          onClick={showVersion}
          style={{
            color: 'var(--ant-color-text-tertiary)'
          }}
        >
          {version.version}
        </Button>
        {showUpgrade && (
          <NewLabel>
            <span className="text">
              {intl.formatMessage({ id: 'common.text.new' })}
            </span>
          </NewLabel>
        )}
      </div>
      <DropDownActions menu={{ ...helpMenu }} popupRender={helpPopupRender}>
        <IconWrapper>
          <IconFont
            type="icon-help"
            className="font-size-20"
            style={{ color: 'var(--ant-color-text-tertiary)' }}
          />
        </IconWrapper>
      </DropDownActions>
      <DropDownActions menu={{ ...userMenu }} popupRender={userPopupRender}>
        <IconWrapper>
          <Avatar
            size={24}
            style={{ ...avatarStyle }}
            src={initialState?.currentUser?.avatar_url}
            icon={<IconFont type="icon-user-filled" className="font-size-24" />}
          />
        </IconWrapper>
      </DropDownActions>
    </Wrapper>
  );
};
