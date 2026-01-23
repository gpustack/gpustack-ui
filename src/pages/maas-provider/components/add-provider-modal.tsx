import { PageActionType } from '@/config/types';
import FormDrawer from '@/pages/_components/form-drawer';
import React, { useRef } from 'react';
import { FormData, MaasProviderItem as ListItem } from '../config/types';

import ProviderForm from '../forms';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  currentData?: ListItem; // Used when action is EDIT
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddProvider: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  currentData,
  onOk,
  onCancel
}) => {
  const form = useRef<any>(null);

  const handleSubmit = () => {
    form.current?.submit();
  };

  const handleOnFinish = async (data: FormData) => {
    console.log('handleOnFinish', data);
    onOk({
      ...data
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
      width={600}
    >
      <ProviderForm
        ref={form}
        action={action}
        currentData={currentData}
        onFinish={handleOnFinish}
      />
    </FormDrawer>
  );
};

export default AddProvider;
