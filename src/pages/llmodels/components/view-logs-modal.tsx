import { Modal } from 'antd';
import React from 'react';

type ViewModalProps = {
  content?: string;
  title: string;
  open: boolean;
  onCancel: () => void;
};

const ViewCodeModal: React.FC<ViewModalProps> = (props) => {
  const { title, open, onCancel, content } = props || {};
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
      <div>{content}</div>
    </Modal>
  );
};

export default ViewCodeModal;
