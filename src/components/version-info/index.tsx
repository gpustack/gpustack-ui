import Logo from '@/assets/images/gpustack-logo.png';
import { GPUStackVersionAtom, UpdateCheckAtom, userAtom } from '@/atoms/user';
import externalLinks from '@/constants/external-links';
import { Button } from 'antd';
import { useAtom } from 'jotai';
import React from 'react';
import './index.less';

const VersionInfo: React.FC<{ intl: any }> = ({ intl }) => {
  const [gpuStackVersionAtom] = useAtom(GPUStackVersionAtom);
  const [userDataAtom] = useAtom(userAtom);
  const [updateCheck] = useAtom(UpdateCheckAtom);

  // current version info
  const {
    version: currentVersion,
    git_commit,
    isProd,
    isDev
  } = gpuStackVersionAtom;

  // user info
  const { is_admin } = userDataAtom || {};

  // update check latest version info
  const { latest_version: latestVersion } = updateCheck;

  const uiVersion = document.documentElement.getAttribute('data-version');

  return (
    <div className="version-box">
      <div className="img">
        <img src={Logo} alt="logo" />
      </div>

      <div className="ver">
        {isProd && (
          <span className="label">
            {intl.formatMessage({ id: 'common.footer.version' })}
          </span>
        )}
        {isProd ? (
          <span className="val">{currentVersion || git_commit}</span>
        ) : (
          <span className="val dev">
            <span className="item">
              <span className="tl">
                {' '}
                {intl.formatMessage({ id: 'common.footer.version.server' })}
              </span>
              {isDev ? git_commit : currentVersion}
            </span>
            <span className="item">
              <span className="tl">UI</span>
              {uiVersion}
            </span>
          </span>
        )}
      </div>
      {is_admin && isProd && (
        <div className="upgrade-text">
          <span className="m-l-5">
            {latestVersion && latestVersion !== currentVersion && !isDev
              ? intl.formatMessage(
                  { id: 'users.version.update' },
                  { version: latestVersion }
                )
              : intl.formatMessage(
                  { id: 'users.version.islatest' },
                  { version: currentVersion }
                )}
          </span>
          <Button
            type="link"
            href={externalLinks.release}
            target="_blank"
            style={{ paddingInline: 0 }}
          >
            {intl.formatMessage({ id: 'common.text.changelog' })}
          </Button>
        </div>
      )}
    </div>
  );
};

export const modalConfig = {
  icon: null,
  centered: false,
  maskClosable: true,
  footer: null,
  style: {
    top: '30%'
  },
  width: 400
};

export default VersionInfo;
