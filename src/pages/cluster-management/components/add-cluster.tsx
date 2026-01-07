import { PageActionType } from '@/config/types';
import FormDrawer from '@/pages/_components/form-drawer';
import React, { useRef } from 'react';
import { ProviderType } from '../config';
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
  provider: ProviderType;
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
    <FormDrawer
      title={title}
      open={open}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      width={710}
    >
      <ClusterForm
        ref={form}
        provider={provider}
        credentialList={credentialList}
        action={action}
        currentData={currentData}
        onFinish={handleOk}
      />
    </FormDrawer>
  );
};

export default AddCluster;
