import LogsViewer from '@/components/logs-viewer';
import { Modal } from 'antd';
import React from 'react';

type ViewModalProps = {
  content: string;
  title: string;
  open: boolean;
  url: string;
  onCancel: () => void;
};

const ViewCodeModal: React.FC<ViewModalProps> = (props) => {
  const { title, open, url, onCancel, content = '' } = props || {};
  if (!open) {
    return null;
  }

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={600}
      style={{ top: '80px' }}
      footer={null}
    >
      <LogsViewer
        content={content}
        height={400}
        url={url}
        params={{
          follow: false
        }}
      ></LogsViewer>
    </Modal>
  );
};

export default ViewCodeModal;
