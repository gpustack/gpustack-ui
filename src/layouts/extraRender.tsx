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
  InfoCircleOutlined,
  LogoutOutlined,
  ReadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { history, useIntl, useNavigate } from '@umijs/max';
import { Avatar, Divider, Modal } from 'antd';
import { useAtom } from 'jotai';
import { useMemo } from 'react';
import styled from 'styled-components';
import { DEFAULT_ENTER_PAGE } from '../config/settings';

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

export const ExtraContent = () => {
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

  const showUpgrade = useMemo(() => {
    return (
      initialState?.currentUser?.is_admin &&
      updateCheck.latest_version &&
      updateCheck.latest_version !== version?.version &&
      updateCheck.latest_version?.indexOf('0.0.0') === -1 &&
      updateCheck.latest_version?.indexOf('rc') === -1
    );
  }, [
    updateCheck.latest_version,
    version.version,
    initialState?.currentUser?.is_admin
  ]);

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
    },
    {
      key: 'version',
      icon: <InfoCircleOutlined />,
      label: intl.formatMessage({ id: 'common.button.version' })
    }
  ];

  const helpMenu = {
    items: helpList.map((item) => ({
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
              className="m-l-8 "
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
          showVersion();
        }
      }
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
            <SettingOutlined />
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
              src={initialState?.currentUser?.avatar}
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
          <LogoutOutlined />
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
      <DropDownActions menu={{ ...helpMenu }} popupRender={helpPopupRender}>
        <IconWrapper>
          <IconFont type="icon-help" className="font-size-20" />
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
        </IconWrapper>
      </DropDownActions>
      <DropDownActions menu={{ ...userMenu }} popupRender={userPopupRender}>
        <IconWrapper>
          <Avatar
            size={24}
            src={initialState?.currentUser?.avatar}
            icon={<IconFont type="icon-user-filled" className="font-size-24" />}
          />
        </IconWrapper>
      </DropDownActions>
    </Wrapper>
  );
};
