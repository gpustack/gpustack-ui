import HighlightCode from '@/components/highlight-code';
import { BulbOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import React from 'react';
import { addWorkerGuide } from '../config';

type ViewModalProps = { token: string };

const AddWorker: React.FC<ViewModalProps> = (props) => {
  const intl = useIntl();

  const origin = window.location.origin;

  return (
    <div className="script-install">
      <h4>{intl.formatMessage({ id: 'resources.worker.linuxormaxos' })}</h4>
      <HighlightCode
        code={addWorkerGuide.mac.registerWorker({
          server: origin,
          token: props.token
        })}
        theme="dark"
      ></HighlightCode>
      <h4>Windows </h4>
      <HighlightCode
        theme="dark"
        code={addWorkerGuide.win.registerWorker({
          server: origin,
          token: props.token
        })}
      ></HighlightCode>
      <h3>
        <BulbOutlined className="m-r-5"></BulbOutlined>
        {intl.formatMessage({ id: 'resources.worker.add.step3' })}
      </h3>
    </div>
  );
};

export default React.memo(AddWorker);
