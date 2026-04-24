import { PageActionType } from '@/config/types';
import { ModalFooter } from '@gpustack/core-ui';
import { useRef } from 'react';
import FormDrawer from '../../../_components/form-drawer';
import { FormData, ListItem } from '../config/types';
import GPUServiceTemplateForm from '../forms';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  currentData?: ListItem | null;
  onOk: (values: FormData) => void;
  onCancel: () => void;
};

const AddModal: React.FC<AddModalProps> = ({
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

  const handleCancel = () => {
    form.current?.resetFields();
    onCancel();
  };

  const onFinish = async (values: FormData) => {
    onOk({
      ...values
    });
  };

  return (
    <FormDrawer
      title={title}
      open={open}
      onCancel={handleCancel}
      onSubmit={handleSubmit}
      width={600}
      footer={
        <ModalFooter
          onOk={handleSubmit}
          onCancel={handleCancel}
          style={{
            padding: '16px 24px 8px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        />
      }
    >
      <GPUServiceTemplateForm
        ref={form}
        action={action}
        currentData={currentData}
        onFinish={onFinish}
        open={open}
      />
    </FormDrawer>
  );
};

export default AddModal;
