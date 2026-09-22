import { GPUStackVersionAtom, UpdateCheckAtom } from '@/atoms/user';
import PluginExtraField from '@/components/plugin-extra-fields';
import VersionInfo, { modalConfig } from '@/components/version-info';
import externalLinks from '@/constants/external-links';
import { logout } from '@/pages/login/apis';
import { getGPUStackPlugin } from '@/plugins';
import { useModel } from '@@/plugin-model';
import {
  DiscordOutlined,
  GithubOutlined,
  HomeOutlined,
  ReadOutlined
} from '@ant-design/icons';
import { DropdownActions, IconFont, useBodyScroll } from '@gpustack/core-ui';
import { history, useIntl, useNavigate } from '@umijs/max';
import { Avatar, Button, Divider, Modal } from 'antd';
import { useAtom } from 'jotai';
import { useMemo } from 'react';
import styled from 'styled-components';
import { DEFAULT_ENTER_PAGE } from '../config/settings';
import GithubStar from './github-star';

// A tinted pill, not a solid orange block. `#fff` on `--ant-orange-5` measured
// 1.91:1 — the one element on the page whose whole job is to be noticed was the
// least legible thing on it. The warning status pair clears AA (4.76:1) and
// brings its own dark-mode values, so this no longer needs a theme branch.
// The nested `transform: scale(0.9)` / `scale(0.8)` is gone too: it faked a
// small font size and left the text on fractional pixels, which is why it read
// blurry. Font size is now just a font size.
const NewLabel = styled.span`
  display: inline-flex;
  align-items: center;
  height: 16px;
  margin-left: 4px;
  padding-inline: 6px;
  border-radius: 8px;
  font-size: 10px;
  color: var(--color-status-warning-text);
  background-color: var(--color-status-warning-bg);

  .text {
    line-height: 1;
  }
`;

// A real `<button>`, not a `<span>`. These wrap the two `Dropdown` triggers in
// the header, and as spans they had no `tabIndex` and no focus handling — with
// the dropdown on `trigger: ['hover']` that made Log out and Preferences
// unreachable by keyboard entirely. A native button is focusable and turns
// Enter/Space into a click, which is why the triggers below also take 'click'.
//
// The box is also the hit target: it used to be the glyph itself (24px for the
// avatar, 20px for help), and there was no hover feedback at all — while the
// version control sitting right beside them is a real antd Button that does
// have it. Three adjacent controls, three behaviours.
//
// 28×28 for both triggers — uniform hit boxes, comfortably over WCAG 2.2 SC
// 2.5.8's 24px minimum. The avatar reads larger than the help icon through its
// GLYPH (20 vs 16), not through a bigger box: the hover rectangles are never
// visible at the same time, so sizing them differently would buy nothing and
// cost the row its alignment.
const IconWrapper = styled.button`
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: var(--border-radius-lg);
  background-color: transparent;
  color: var(--ant-color-text-secondary);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--ant-control-item-bg-hover);
  }

  &:focus-visible {
    outline: 2px solid var(--ant-color-primary);
    outline-offset: 2px;
  }
`;

// 12, not 24: the icon triggers now carry their own 28px hover box, so the gap
// no longer has to stand in for one. Not 8, because this row is not a uniform
// icon cluster — it also holds an org switcher, the GitHub star widget and the
// version string, and those have no internal padding to borrow from.
const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 32px;
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

// Rows that act (Log out) render as `as="button"`, so the resets below are here
// rather than inline: without them the row would inherit the UA button font,
// border and centred text. Same reason as `IconWrapper` — a `div` with an
// `onClick` is not reachable by keyboard, and Log out is exactly the thing a
// keyboard user needs to reach.
const CustomItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  justify-content: flex-start;
  padding: 0 var(--ant-padding-xs);
  border: none;
  border-radius: var(--border-radius-base);
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--ant-color-primary);
    outline-offset: -2px;
  }

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
  const plugin = getGPUStackPlugin();
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

  // With no uploaded image there is no avatar — just an icon, the same size and
  // colour as the help icon beside it, in the same hover box.
  //
  // What was here before: a grey disc (antd's Avatar default, `#fff` glyph on
  // `colorTextPlaceholder` `#bfbfbf`) measuring **1.84:1** in light mode, under
  // the 3:1 floor for a graphic, because `avatarStyle` only returned a value
  // when `isDarkTheme` — dark had been fixed at some point and light never was.
  // Re-tinting that disc was also wrong: a filled chip wrapped around a glyph
  // is decoration around decoration, and it left the placeholder looking
  // nothing like the icon sitting next to it.
  //
  // The circle only earns its place when there is a photo to crop, and then it
  // is 24 inside the 28 box so the hover ring still shows around it.
  //
  // 20px, one step above the help icon's 16. The avatar is an IDENTITY, not a
  // command — sizing it identically to the utility icon beside it demotes it to
  // being one more of them. Both sizes are on the type scale; the 18 this
  // briefly used was not, being a number split between the old help glyph (20)
  // and the old avatar (24).
  //
  // Colour does NOT follow the sider, which is `text-tertiary` at 16px: those
  // icons sit beside a text label that carries the meaning, so the glyph is
  // reinforcement. These have no label — the glyph is the only thing
  // identifying the control — so they take `text-secondary` (7.00:1 light /
  // 7.69:1 dark, vs tertiary's 3.36:1, barely over the 3:1 graphic floor).
  // FILLED, deliberately — this glyph is a solid disc with the person knocked
  // out of it, and that mass is the point. It is the one identity object in a
  // row of line-drawn commands, and reading as a different kind of thing is
  // what lets the eye find it. Swapping it to the outline `icon-user` was
  // tried: it matched the gear's weight and lost all distinction from it.
  //
  // What was actually wrong earlier was not the mass but the CHROME around it
  // — a 16px glyph floating in a tinted 24px chip, small inside big. The mass
  // now comes from the glyph itself at 20px with nothing behind it.
  const userGlyph = (
    <IconFont type="icon-user-filled" className="font-size-20" />
  );
  const avatarUrl = initialState?.currentUser?.avatar_url;
  const renderUserAvatar = () =>
    avatarUrl ? (
      <Avatar size={24} src={avatarUrl} icon={userGlyph} />
    ) : (
      userGlyph
    );

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
      key: 'imageSelector',
      icon: <IconFont type="icon-docker"></IconFont>,
      label: intl.formatMessage({ id: 'common.button.imageSelector' }),
      url: externalLinks.imageSelector
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
        key: 'settings',
        label: (
          <span className="flex flex-center">
            <IconFont type="icon-preferences" />
            <span className="m-l-8" style={{ marginLeft: 8 }}>
              {intl?.formatMessage?.({ id: 'common.preferences' })}
            </span>
          </span>
        ),
        onClick: () => {
          history.push('/preferences');
        }
      }
    ]
  };

  const userPopupRender = (originNode: React.ReactNode) => {
    return (
      <DropdownWrapper>
        <CustomItem className="user-info border-bottom">
          <span className="flex-center gap-8">
            {renderUserAvatar()}
            <span className="user-name">
              {initialState?.currentUser?.username}
            </span>
          </span>
        </CustomItem>
        <Divider style={{ marginBlock: 4 }} />
        {originNode}
        <Divider style={{ marginBlock: 4 }} />
        <CustomItem
          as="button"
          type="button"
          onClick={handleLogout}
          className="border-top"
        >
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
      <PluginExtraField name="OrgSwitcher" isDarkTheme={isDarkTheme} />
      {process.env.ENABLE_ENTERPRISE !== 'true' && <GithubStar />}
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
            <span className="text font-400">
              {intl.formatMessage({ id: 'common.text.new' })}
            </span>
          </NewLabel>
        )}
      </div>
      {!plugin && (
        <DropdownActions
          menu={{ ...helpMenu }}
          popupRender={helpPopupRender}
          trigger={['hover', 'click']}
        >
          <IconWrapper
            type="button"
            aria-label={intl.formatMessage({ id: 'common.button.help' })}
          >
            {/* No colour override: it inherits `IconWrapper`'s
                `text-secondary`, same as the user glyph. `text-tertiary`
                measured 3.36:1 in light mode — barely over the 3:1 graphic
                floor, and it read as a hint rather than an action. */}
            <IconFont type="icon-help" className="font-size-16" />
          </IconWrapper>
        </DropdownActions>
      )}
      <PluginExtraField name="GlobalSettings" />
      <DropdownActions
        menu={{ ...userMenu }}
        popupRender={userPopupRender}
        trigger={['hover', 'click']}
      >
        <IconWrapper
          type="button"
          aria-label={
            initialState?.currentUser?.username ||
            intl.formatMessage({ id: 'menu.profile' })
          }
        >
          {renderUserAvatar()}
        </IconWrapper>
      </DropdownActions>
    </Wrapper>
  );
};
