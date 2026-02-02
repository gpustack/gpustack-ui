import FormDrawer from '@/pages/_components/form-drawer';
import React, { useRef } from 'react';
import { FormData, RouteItem as ListItem } from '../config/types';
import FallbackSettings from '../forms/fallback-settings';

type AddModalProps = {
  title: string;
  open: boolean;
  currentData?: ListItem; // Used when action is EDIT
  onOk: (values: FormData) => void;
  onCancel: () => void;
};
const AddProvider: React.FC<AddModalProps> = ({
  title,
  open,
  currentData,
  onOk,
  onCancel
}) => {
  const form = useRef<any>(null);

  const handleSubmit = () => {
    form.current?.submit();
  };

  const onFinish = async (data: FormData) => {
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
      <FallbackSettings currentData={currentData} onFinish={onFinish} />
    </FormDrawer>
  );
};

export default AddProvider;
