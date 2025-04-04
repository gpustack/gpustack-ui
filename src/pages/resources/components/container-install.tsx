import { GPUStackVersionAtom } from '@/atoms/user';
import { getAtomStorage } from '@/atoms/utils';
import HighlightCode from '@/components/highlight-code';
import { WarningOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Radio } from 'antd';
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

    const commandCode = addWorkerGuide[activeKey];

    if (activeKey === 'cuda') {
      return commandCode?.registerWorker({
        server: origin,
        tag: version,
        token: '${mytoken}',
        workerip: '${myworkerip}'
      });
    }
    return commandCode?.registerWorker({
      server: origin,
      tag: `${version}-${activeKey}`,
      token: '${mytoken}',
      workerip: '${myworkerip}'
    });
  }, [versionInfo, activeKey, props.token]);

  return (
    <div className="container-install">
      <ul className="notes">
        <li>
          <span>
            {intl.formatMessage({ id: 'resources.worker.container.supported' })}
          </span>
          <WarningOutlined
            style={{ color: 'var(--ant-color-warning)' }}
            className="font-size-14 m-l-5"
          />
        </li>
        <li>
          {intl.formatMessage(
            { id: 'resources.worker.current.version' },
            { version: versionInfo.version }
          )}
        </li>
        <li>
          <span>
            {intl.formatMessage({ id: 'resources.worker.driver.install' })}
          </span>
          <WarningOutlined
            style={{ color: 'var(--ant-color-warning)' }}
            className="font-size-14 m-l-5 m-r-5"
          />
          <Button
            style={{ padding: 0 }}
            type="link"
            size="small"
            href="https://docs.gpustack.ai/latest/installation/installation-requirements/"
            target="_blank"
          >
            {intl.formatMessage({ id: 'playground.audio.enablemic.doc' })}
          </Button>
        </li>
      </ul>
      <h3 className="font-size-14 font-600">
        1.{' '}
        <span
          dangerouslySetInnerHTML={{
            __html: intl.formatMessage({ id: 'resources.worker.add.step1' })
          }}
        ></span>
      </h3>
      <HighlightCode
        code={addWorkerGuide.container.getToken}
        theme="dark"
        lang="bash"
      ></HighlightCode>
      <h3 className="m-t-10 font-size-14 font-600">
        2. {intl.formatMessage({ id: 'resources.worker.add.step2' })}{' '}
        <span
          className="font-size-12"
          style={{ color: 'var(--ant-color-text-tertiary)' }}
          dangerouslySetInnerHTML={{
            __html: `(${intl.formatMessage({
              id: 'resources.worker.add.step2.tips'
            })})`
          }}
        ></span>
      </h3>
      <div className="m-b-16">
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
      {activeKey === 'npu' && (
        <div
          className="m-b-8 text-tertiary"
          dangerouslySetInnerHTML={{
            __html: intl.formatMessage({ id: 'resources.worker.cann.tips' })
          }}
        ></div>
      )}
      <HighlightCode theme="dark" code={code} lang="bash"></HighlightCode>
      <h3 className="m-b-0 m-t-10 font-size-14 font-600">
        3. {intl.formatMessage({ id: 'resources.worker.add.step3' })}
      </h3>
    </div>
  );
};

export default React.memo(AddWorker);
