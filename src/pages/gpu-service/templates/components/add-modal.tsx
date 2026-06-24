import { PageActionType } from '@/config/types';
import useSubmitLock from '@/hooks/use-submit-lock';
import { FormDrawer, ModalFooter } from '@gpustack/core-ui';
import { useRef } from 'react';
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
  const { loading, guard, run, release } = useSubmitLock();

  const handleSubmit = () => {
    guard(() => form.current?.submit());
  };

  const handleCancel = () => {
    form.current?.resetFields();
    onCancel();
  };

  const onFinish = async (values: FormData) => {
    await run(() =>
      onOk({
        ...values
      })
    );
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
          loading={loading}
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
        onFinishFailed={release}
        open={open}
      />
    </FormDrawer>
  );
};

export default AddModal;
