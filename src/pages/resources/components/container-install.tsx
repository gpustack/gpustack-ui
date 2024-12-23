import { GPUStackVersionAtom } from '@/atoms/user';
import { getAtomStorage } from '@/atoms/utils';
import HighlightCode from '@/components/highlight-code';
import { BulbOutlined, WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Radio } from 'antd';
import React from 'react';
import { addWorkerGuide, containerInstallOptions } from '../config';
import './styles/installation.less';

type ViewModalProps = {
  token: string;
};

const AddWorker: React.FC<ViewModalProps> = (props) => {
  const intl = useIntl();

  const origin = window.location.origin;
  const [activeKey, setActiveKey] = React.useState('cuda');
  const versionInfo = getAtomStorage(GPUStackVersionAtom);

  const code = React.useMemo(() => {
    let version = versionInfo?.version;
    if (!version || !versionInfo.isProduction) {
      version = 'main';
    }
    if (activeKey === 'cuda') {
      return addWorkerGuide.docker.registerWorker({
        server: origin,
        tag: version,
        token: props.token
      });
    }
    return addWorkerGuide.docker.registerWorker({
      server: origin,
      tag: `${version}-${activeKey}`,
      token: props.token
    });
  }, [versionInfo, activeKey, props.token, origin]);

  return (
    <div className="container-install">
      <div className="notes">
        <span>
          1.{' '}
          <span>
            {intl.formatMessage({ id: 'resources.worker.container.supported' })}
          </span>
          <WarningOutlined
            style={{ color: 'var(--ant-color-warning)' }}
            className="font-size-14 m-l-5"
          />
        </span>
        <span>
          2.{' '}
          {intl.formatMessage(
            { id: 'resources.worker.current.version' },
            { version: versionInfo.version }
          )}
        </span>
        <span>
          3. {intl.formatMessage({ id: 'resources.worker.select.command' })}
        </span>
      </div>
      <div className="m-b-20">
        <Radio.Group
          block
          options={containerInstallOptions}
          defaultValue={activeKey}
          value={activeKey}
          optionType="button"
          buttonStyle="solid"
          onChange={(e) => setActiveKey(e.target.value)}
          size="small"
        />
      </div>
      <HighlightCode theme="dark" code={code}></HighlightCode>
      <h3>
        <BulbOutlined className="m-r-5"></BulbOutlined>
        {intl.formatMessage({ id: 'resources.worker.add.step3' })}
      </h3>
    </div>
  );
};

export default React.memo(AddWorker);
