import Logo from '@/assets/images/gpustack-logo.png';
import { GPUStackVersionAtom } from '@/atoms/user';
import { getAtomStorage } from '@/atoms/utils';
import React from 'react';
import './index.less';

const VersionInfo: React.FC<{ intl: any }> = ({ intl }) => {
  // get the data attr from html
  const version = document.documentElement.getAttribute('data-version');

  return (
    <div className="version-box">
      <div className="img">
        <img src={Logo} alt="logo" />
      </div>
      <div className="title">
        {intl.formatMessage({ id: 'common.footer.version.title' })}
      </div>
      <div>
        <div className="ver">
          <span className="label">
            {' '}
            {intl.formatMessage({ id: 'common.footer.version.server' })}
          </span>
          <span className="val">
            {getAtomStorage(GPUStackVersionAtom)?.version ||
              getAtomStorage(GPUStackVersionAtom)?.git_commit}
          </span>
        </div>
        <div className="ver">
          <span className="label">UI </span>
          <span className="val"> {version}</span>
        </div>
      </div>
    </div>
  );
};

export default VersionInfo;
