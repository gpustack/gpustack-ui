import LogsViewer from '@/components/logs-viewer';
import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import React from 'react';

type ViewModalProps = {
  open: boolean;
  url: string;
  onCancel: () => void;
};

const ViewCodeModal: React.FC<ViewModalProps> = (props) => {
  console.log('viewlogs======');
  const { open, url, onCancel } = props || {};
  const intl = useIntl();
  if (!open) {
    return null;
  }

  return (
    <Modal
      title={intl.formatMessage({ id: 'common.button.viewlog' })}
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
      <LogsViewer
        height={500}
        url={url}
        params={{
          follow: true
        }}
      ></LogsViewer>
    </Modal>
  );
};

export default React.memo(ViewCodeModal);
