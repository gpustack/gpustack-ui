import { PageActionType } from '@/config/types';
import { ModalFooter } from '@gpustack/core-ui';
import { useRef } from 'react';
import FormDrawer from '../../../_components/form-drawer';
import { FormContext } from '../config/form-context';
import { FormData, ListItem } from '../config/types';
import GPUServiceStorageForm from '../forms';

type AddModalProps = {
  title: string;
  action: PageActionType;
  open: boolean;
  onOk: (values: FormData) => void;
  data?: ListItem | null;
  onCancel: () => void;
  storageClassList: Global.BaseOption<string>[];
};

const AddModal: React.FC<AddModalProps> = ({
  title,
  action,
  open,
  onOk,
  data,
  onCancel,
  storageClassList
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
      <FormContext.Provider value={{ storageClassList }}>
        <GPUServiceStorageForm
          ref={form}
          action={action}
          currentData={data}
          onFinish={onFinish}
          open={open}
        />
      </FormContext.Provider>
    </FormDrawer>
  );
};

export default AddModal;
