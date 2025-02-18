import HighlightCode from '@/components/highlight-code';
import { useIntl } from '@umijs/max';
import React from 'react';
import { addWorkerGuide } from '../config';

type ViewModalProps = { token: string };

const AddWorker: React.FC<ViewModalProps> = (props) => {
  const intl = useIntl();

  const origin = window.location.origin;

  return (
    <div className="script-install">
      <h3>1. {intl.formatMessage({ id: 'resources.worker.add.step1' })}</h3>
      <h4>{intl.formatMessage({ id: 'resources.worker.linuxormaxos' })}</h4>
      <HighlightCode
        code={addWorkerGuide.mac.getToken}
        theme="dark"
      ></HighlightCode>
      <h4 className="m-t-6">Windows </h4>
      <HighlightCode
        code={addWorkerGuide.win.getToken}
        theme="dark"
      ></HighlightCode>
      <h3 className="m-t-10">
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
      <h4>{intl.formatMessage({ id: 'resources.worker.linuxormaxos' })}</h4>
      <HighlightCode
        code={addWorkerGuide.mac.registerWorker({
          server: origin,
          token: '${mytoken}'
        })}
        theme="dark"
      ></HighlightCode>
      <h4 className="m-t-6">Windows </h4>
      <HighlightCode
        theme="dark"
        code={addWorkerGuide.win.registerWorker({
          server: origin,
          token: '${mytoken}'
        })}
      ></HighlightCode>
      <h3 className="m-b-0 m-t-10">
        3. {intl.formatMessage({ id: 'resources.worker.add.step3' })}
      </h3>
    </div>
  );
};

export default React.memo(AddWorker);
