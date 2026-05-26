import { PageAction } from '@/config';
import FormOverlayView from '@/pages/_components/form-overlay-view';
import { FormContext } from '@/pages/gpu-service/storage/config/form-context';
import useQueryStorageClass from '@/pages/gpu-service/storage/services/use-query-storage-class';
import { ModalFooter } from '@gpustack/core-ui';
import { useIntl } from '@umijs/max';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormData as StorageFormData } from '../../storage/config/types';
import GPUServiceStorageForm from '../../storage/forms';

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

  const getOverlayContainer = useCallback(() => {
    const containers = document.querySelectorAll<HTMLElement>(
      '.ant-layout-content'
    );

    return containers[containers.length - 1] ?? null;
  }, []);

  return (
    <FormOverlayView
      title={intl.formatMessage({ id: 'gpuservice.storage.add' })}
      open={open}
      width={600}
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
    </FormOverlayView>
  );
};

export default StorageOverlay;
