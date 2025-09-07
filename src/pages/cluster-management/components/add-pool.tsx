import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal';
import { PageActionType } from '@/config/types';
import React, { useRef } from 'react';
import { ProviderType } from '../config';
import {
  NodePoolFormData as FormData,
  NodePoolListItem as ListItem
} from '../config/types';
import PoolForm from './pool-form';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  provider: ProviderType; // 'kubernetes' | 'custom' | 'digitalocean';
  currentData?: ListItem | null;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddPool: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  provider,
  onOk,
  currentData,
  onCancel
}) => {
  const formRef = useRef<any>(null);

  const handleSubmit = () => {
    formRef.current?.submit?.();
  };

  const handleOnFinish = async (data: FormData) => {
    onOk(data);
  };

  const handleCancel = () => {
    formRef.current?.reset?.();
    onCancel();
  };

  return (
    <ScrollerModal
      title={title}
      open={open}
      onCancel={handleCancel}
      destroyOnHidden={true}
      closeIcon={true}
      maskClosable={false}
      keyboard={false}
      width={600}
      footer={
        <ModalFooter onOk={handleSubmit} onCancel={onCancel}></ModalFooter>
      }
    >
      <PoolForm
        ref={formRef}
        action={action}
        provider={provider}
        currentData={currentData}
        onFinish={handleOnFinish}
      ></PoolForm>
    </ScrollerModal>
  );
};

export default AddPool;
