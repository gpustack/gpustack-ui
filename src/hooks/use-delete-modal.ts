import { useIntl } from '@umijs/max';
import { Modal, message, type ModalFuncProps } from 'antd';
import { useRef } from 'react';

export default function useDeleteModal() {
  const intl = useIntl();
  const modalRef = useRef<any>();
  const showDeleteModal = (config: ModalFuncProps = {}) => {
    modalRef.current = Modal.confirm({
      ...config,
      okText: intl.formatMessage({
        id: 'common.button.delete'
      }),
      onCancel: () => {
        config.onCancel?.();
        modalRef.current.destroy?.();
      },
      onOk: async () => {
        await config.onOk?.();
        message.success(intl.formatMessage({ id: 'common.message.success' }));
      }
    });
  };

  return { showDeleteModal };
}
