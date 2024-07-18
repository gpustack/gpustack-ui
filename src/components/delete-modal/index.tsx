import ModalFooter from '@/components/modal-footer';
import { useIntl } from '@umijs/max';
import { Modal, type ModalFuncProps } from 'antd';
import { forwardRef } from 'react';

const DeleteModal: React.FC<ModalFuncProps> = forwardRef((props, ref) => {
  const intl = useIntl();
  const { title, open, onOk, onCancel, content } = props;

  return (
    <Modal
      title={title}
      simple={true}
      open={open}
      centered={true}
      onOk={onOk}
      onCancel={onCancel}
      destroyOnClose={true}
      closeIcon={false}
      maskClosable={false}
      keyboard={false}
      width={600}
      styles={{}}
      footer={<ModalFooter onCancel={onCancel} onOk={onOk}></ModalFooter>}
    >
      {content}
    </Modal>
  );
});

export default DeleteModal;
