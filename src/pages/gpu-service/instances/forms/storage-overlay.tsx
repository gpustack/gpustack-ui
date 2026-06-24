import { PageAction } from '@/config';
import { FormContext } from '@/pages/gpu-service/storage/config/form-context';
import useQueryStorageClass from '@/pages/gpu-service/storage/services/use-query-storage-class';
import { ModalFooter, SubDrawer } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useEffect, useRef, useState } from 'react';
import { FormData as StorageFormData } from '../../storage/config/types';
import GPUServiceStorageForm from '../../storage/forms';
import useOverlayLayout from '../hooks/use-overlay-layout';

interface StorageOverlayProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: StorageFormData) => Promise<void> | void;
}

const StorageOverlay: React.FC<StorageOverlayProps> = ({
  open,
  onCancel,
  onSubmit
}) => {
  const intl = useIntl();
  const { storageClassList, fetchData: fetchStorageClass } =
    useQueryStorageClass();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<any>(null);
  const { drawerWidth, getOverlayContainer } = useOverlayLayout(open);

  useEffect(() => {
    if (open) {
      fetchStorageClass({ page: -1 });
    }
  }, [open]);

  const handleSubmit = () => {
    formRef.current?.submit();
  };

  const handleCancel = () => {
    formRef.current?.resetFields();
    onCancel();
  };

  const handleFinish = async (values: StorageFormData) => {
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubDrawer
      title={intl.formatMessage({ id: 'gpuservice.storage.add' })}
      open={open}
      width={drawerWidth}
      onCancel={handleCancel}
      getContainer={getOverlayContainer}
      footer={
        <ModalFooter
          onOk={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          style={{
            padding: '16px 24px 24px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        />
      }
    >
      <FormContext.Provider value={{ storageClassList }}>
        <GPUServiceStorageForm
          ref={formRef}
          action={PageAction.CREATE}
          open={open}
          onFinish={handleFinish}
        />
      </FormContext.Provider>
    </SubDrawer>
  );
};

export default StorageOverlay;
