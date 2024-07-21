import HighlightCode from '@/components/highlight-code';
import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import React from 'react';
import { addWorkerGuide } from '../config';

type ViewModalProps = {
  open: boolean;
  onCancel: () => void;
};

const AddWorker: React.FC<ViewModalProps> = (props) => {
  const { open, onCancel } = props || {};
  const intl = useIntl();

  const origin = window.location.origin;

  return (
    <Modal
      title={intl.formatMessage({ id: 'resources.button.create' })}
      open={open}
      centered={true}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={600}
      footer={null}
    >
      <div>
        <h3>1. {intl.formatMessage({ id: 'resources.worker.add.step1' })}</h3>
        <h4>Linux Or MacOS </h4>
        <HighlightCode code={addWorkerGuide.mac.getToken}></HighlightCode>
        <h4>Windows </h4>
        <HighlightCode code={addWorkerGuide.win.getToken}></HighlightCode>
        <h3>2. {intl.formatMessage({ id: 'resources.worker.add.step2' })}</h3>
        <h4>Linux Or MacOS </h4>
        <HighlightCode
          code={addWorkerGuide.mac.registerWorker(origin)}
        ></HighlightCode>
        <h4>Windows </h4>
        <HighlightCode
          code={addWorkerGuide.win.registerWorker(origin)}
        ></HighlightCode>
        <h3>3. {intl.formatMessage({ id: 'resources.worker.add.step3' })}</h3>
      </div>
    </Modal>
  );
};

export default React.memo(AddWorker);
