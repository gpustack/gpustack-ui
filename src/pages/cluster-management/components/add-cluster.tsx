import ModalFooter from '@/components/modal-footer';
import ScrollerModal from '@/components/scroller-modal/index';
import { PageActionType } from '@/config/types';
import React, { useRef } from 'react';
import {
  ClusterFormData as FormData,
  ClusterListItem as ListItem
} from '../config/types';
import ClusterForm from './cluster-form';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  currentData?: ListItem; // Used when action is EDIT
  provider: string;
  credentialList: Global.BaseOption<number>[];
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddCluster: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  provider,
  currentData,
  credentialList,
  onOk,
  onCancel
}) => {
  const form = useRef<any>(null);

  const handleSubmit = () => {
    form.current?.submit();
  };

  const handleOk = async (data: FormData) => {
    onOk({
      ...data,
      provider
    });
  };

  const handleCancel = () => {
    form.current?.resetFields();
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
      width={680}
      footer={
        <ModalFooter onOk={handleSubmit} onCancel={onCancel}></ModalFooter>
      }
    >
      <ClusterForm
        ref={form}
        provider={provider}
        credentialList={credentialList}
        action={action}
        currentData={currentData}
        onFinish={handleOk}
      />
    </ScrollerModal>
  );
};

export default AddCluster;
