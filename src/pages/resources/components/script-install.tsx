import HighlightCode from '@/components/highlight-code';
import { useIntl } from '@umijs/max';
import React, { useMemo } from 'react';
import { addWorkerGuide } from '../config';

type ViewModalProps = { token: string };

const AddWorker: React.FC<ViewModalProps> = (props) => {
  const intl = useIntl();

  const origin = window.location.origin;

  const labels = useMemo(
    () => ({
      step1: intl.formatMessage({ id: 'resources.worker.add.step1' }),
      step2: intl.formatMessage({ id: 'resources.worker.add.step2' }),
      step2Tips: intl.formatMessage({ id: 'resources.worker.add.step2.tips' }),
      step3: intl.formatMessage({ id: 'resources.worker.add.step3' }),
      linuxOrMac: intl.formatMessage({ id: 'resources.worker.linuxormaxos' })
    }),
    [intl]
  );

  return (
    <div className="script-install">
      <h3 className="font-size-14 font-600">
        1. <span dangerouslySetInnerHTML={{ __html: labels.step1 }}></span>
      </h3>
      <h4 className="font-size-13">{labels.linuxOrMac}</h4>
      <HighlightCode
        code={addWorkerGuide.mac.getToken}
        theme="dark"
      ></HighlightCode>
      <h4 className="m-t-6 font-size-13">Windows </h4>
      <HighlightCode
        code={addWorkerGuide.win.getToken}
        theme="dark"
      ></HighlightCode>
      <h3 className="m-t-10 font-size-14 font-600">
        2. {labels.step2}{' '}
        <span
          className="font-size-12"
          style={{ color: 'var(--ant-color-text-tertiary)' }}
          dangerouslySetInnerHTML={{
            __html: `${labels.step2Tips}`
          }}
        ></span>
      </h3>
      <h4 className="font-size-13">{labels.linuxOrMac}</h4>
      <HighlightCode
        code={addWorkerGuide.mac.registerWorker({
          server: origin,
          token: '${token}'
        })}
        theme="dark"
      ></HighlightCode>
      <h4 className="m-t-6 font-size-13">Windows</h4>
      <HighlightCode
        theme="dark"
        code={addWorkerGuide.win.registerWorker({
          server: origin,
          token: '${token}'
        })}
      ></HighlightCode>
      <h3 className="m-b-0 m-t-10 font-size-14 font-600">3. {labels.step3}</h3>
    </div>
  );
};

export default AddWorker;
